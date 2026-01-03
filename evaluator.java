import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.math.BigDecimal;
import java.util.*;

/**
 * POJO-based compiled-rule model + evaluator (tri-state, lazy fetch, short-circuit).
 *
 * Assumes compiled JSON schema (like we discussed) with:
 *  - fetch_groups: { FG_ID: {datasource, namespace, evaluation_group?, cost_tier, fields[] ...}, ... }
 *  - predicates:   { P1: {field, fetch_group, op, value, short_circuit_role?}, ... }
 *  - expr_nodes:   { N1: {type, terms[]}, N2: {type:"ATOM", term:"P1"}, ... }
 *  - dependency_index: { FG_ID: ["P1","P2"...], ... }
 *  - root: "N#"
 *  - execution_plan: { phase_0_free_eval: [...], default_fetch_order_after_free_eval:[...] }
 *
 * Runtime context is a nested map: ctx[ datasource ][ namespace ][ field ] = value
 * Example:
 *   session.customer.status = "active"
 *   CASGraphQL.customer.age = 45
 */
public class CcrePojoCompiledEngine {

    // -------------------------
    // 1) POJOs for compiled form
    // -------------------------

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CompiledRule {
        @JsonProperty("compiled_version")
        public String compiledVersion;

        @JsonProperty("source_rule_version")
        public String sourceRuleVersion;

        @JsonProperty("tri_state")
        public List<String> triState;

        @JsonProperty("fetch_groups")
        public Map<String, FetchGroup> fetchGroups = new LinkedHashMap<>();

        @JsonProperty("predicates")
        public Map<String, PredicateDef> predicates = new LinkedHashMap<>();

        @JsonProperty("expr_nodes")
        public Map<String, ExprNode> exprNodes = new LinkedHashMap<>();

        @JsonProperty("dependency_index")
        public Map<String, List<String>> dependencyIndex = new LinkedHashMap<>();

        @JsonProperty("root")
        public String root;

        @JsonProperty("execution_plan")
        public ExecutionPlan executionPlan;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FetchGroup {
        public String datasource;
        public String namespace;

        // present for non-session groups typically
        public String evaluation_group;

        public String cost_tier;
        public List<String> requires = new ArrayList<>();
        public List<String> fields = new ArrayList<>();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PredicateDef {
        public String field;
        public String fetch_group;
        public String op;

        // can be String/Number/Boolean/List/Map/null depending on JSON
        public Object value;

        // optional: "gate" for session predicates
        public String short_circuit_role;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ExprNode {
        public String type;                 // AND / OR / ATOM
        public List<String> terms;          // for AND/OR
        public String term;                 // for ATOM
        public String simplify_hint;        // optional
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ExecutionPlan {
        public String strategy;

        @JsonProperty("phase_0_free_eval")
        public List<String> phase0FreeEval = new ArrayList<>();

        @JsonProperty("default_fetch_order_after_free_eval")
        public List<String> defaultFetchOrderAfterFreeEval = new ArrayList<>();

        @JsonProperty("why_this_order")
        public List<String> whyThisOrder = new ArrayList<>();
    }

    // -------------------------
    // 2) Runtime context + patch
    // -------------------------

    public static class Context {
        // datasource -> namespace -> field -> value
        private final Map<String, Map<String, Map<String, Object>>> data = new HashMap<>();

        public Object get(String datasource, String namespace, String field) {
            return data.getOrDefault(datasource, Map.of())
                    .getOrDefault(namespace, Map.of())
                    .get(field);
        }

        public void put(String datasource, String namespace, String field, Object value) {
            data.computeIfAbsent(datasource, k -> new HashMap<>())
                    .computeIfAbsent(namespace, k -> new HashMap<>())
                    .put(field, value);
        }

        /** Merge patch data into this context (deep merge by ds/ns/field). */
        public void merge(ContextPatch patch) {
            for (var dsEntry : patch.data.entrySet()) {
                String ds = dsEntry.getKey();
                for (var nsEntry : dsEntry.getValue().entrySet()) {
                    String ns = nsEntry.getKey();
                    for (var fEntry : nsEntry.getValue().entrySet()) {
                        put(ds, ns, fEntry.getKey(), fEntry.getValue());
                    }
                }
            }
        }
    }

    public static class ContextPatch {
        // datasource -> namespace -> field -> value
        public final Map<String, Map<String, Map<String, Object>>> data = new HashMap<>();

        public ContextPatch put(String datasource, String namespace, String field, Object value) {
            data.computeIfAbsent(datasource, k -> new HashMap<>())
                    .computeIfAbsent(namespace, k -> new HashMap<>())
                    .put(field, value);
            return this;
        }
    }

    // -------------------------
    // 3) Evaluator (tri-state + blockers + lazy fetch)
    // -------------------------

    public enum Tri { TRUE, FALSE, UNKNOWN }

    public interface Fetcher {
        /**
         * Fetch all needed fields for this fetch group and return a patch.
         * You implement CASGraphQL/APIgraphql calls here.
         */
        ContextPatch fetch(String fetchGroupId, FetchGroup meta, Context ctx) throws Exception;
    }

    public static class EvalOptions {
        /** If still UNKNOWN after all candidates fetched, return FALSE instead of UNKNOWN. */
        public boolean unknownMeansFalse = false;

        /** Safety guard */
        public int maxFetches = 50;
    }

    public static class Evaluator {
        private final CompiledRule compiled;

        public Evaluator(CompiledRule compiled) {
            this.compiled = compiled;
            if (compiled.root == null || compiled.root.isBlank()) {
                throw new IllegalArgumentException("compiled.root is missing");
            }
        }

        public Tri evaluate(Context ctx, Fetcher fetcher, EvalOptions options) throws Exception {
            Set<String> fetchedFGs = new HashSet<>();

            // Phase 0: mark FREE/session groups as already available (no fetch)
            if (compiled.executionPlan != null && compiled.executionPlan.phase0FreeEval != null) {
                fetchedFGs.addAll(compiled.executionPlan.phase0FreeEval);
            } else {
                // fallback: infer session groups
                for (var e : compiled.fetchGroups.entrySet()) {
                    if ("session".equalsIgnoreCase(e.getValue().datasource)) fetchedFGs.add(e.getKey());
                }
            }

            Tri r = evalNode(compiled.root, ctx);
            if (r != Tri.UNKNOWN) return r;

            int fetches = 0;
            while (r == Tri.UNKNOWN) {
                if (++fetches > options.maxFetches) {
                    return options.unknownMeansFalse ? Tri.FALSE : Tri.UNKNOWN;
                }

                Set<String> blockers = blockersOfAny(compiled.root, ctx);
                Set<String> candidateFGs = candidateFetchGroups(blockers, fetchedFGs);

                if (candidateFGs.isEmpty()) {
                    return options.unknownMeansFalse ? Tri.FALSE : Tri.UNKNOWN;
                }

                String nextFG = selectNextFetchGroup(candidateFGs);

                FetchGroup meta = compiled.fetchGroups.get(nextFG);
                if (meta == null) throw new IllegalStateException("Missing fetch_group meta for: " + nextFG);

                ContextPatch patch = fetcher.fetch(nextFG, meta, ctx);
                if (patch != null) ctx.merge(patch);

                fetchedFGs.add(nextFG);

                r = evalNode(compiled.root, ctx);
            }
            return r;
        }

        // -------- selection --------

        private String selectNextFetchGroup(Set<String> candidateFGs) {
            // Deterministic: follow execution_plan.default_fetch_order_after_free_eval
            if (compiled.executionPlan != null && compiled.executionPlan.defaultFetchOrderAfterFreeEval != null) {
                for (String fg : compiled.executionPlan.defaultFetchOrderAfterFreeEval) {
                    if (candidateFGs.contains(fg)) return fg;
                }
            }
            // fallback
            return candidateFGs.stream().sorted().findFirst().orElseThrow();
        }

        private Set<String> candidateFetchGroups(Set<String> blockerPredIds, Set<String> fetchedFGs) {
            Set<String> out = new HashSet<>();
            for (String pid : blockerPredIds) {
                PredicateDef p = compiled.predicates.get(pid);
                if (p == null) continue;
                if (p.fetch_group != null && !fetchedFGs.contains(p.fetch_group)) out.add(p.fetch_group);
            }
            return out;
        }

        // -------- blockers (only unknowns that still matter) --------

        private Set<String> blockersOfAny(String id, Context ctx) {
            if (id.startsWith("P")) {
                Tri r = evalPredicate(id, ctx);
                return (r == Tri.UNKNOWN) ? Set.of(id) : Set.of();
            }
            return blockersOfNode(id, ctx);
        }

        private Set<String> blockersOfNode(String nodeId, Context ctx) {
            ExprNode n = compiled.exprNodes.get(nodeId);
            if (n == null) throw new IllegalArgumentException("Missing expr_node: " + nodeId);

            String type = safeUpper(n.type);
            if ("ATOM".equals(type)) {
                if (n.term == null) throw new IllegalArgumentException("ATOM node missing term: " + nodeId);
                Tri r = evalPredicate(n.term, ctx);
                return (r == Tri.UNKNOWN) ? Set.of(n.term) : Set.of();
            }

            if (n.terms == null || n.terms.isEmpty()) {
                throw new IllegalArgumentException(type + " node missing terms: " + nodeId);
            }

            if ("AND".equals(type)) {
                boolean anyFalse = false;
                List<String> unknownChildren = new ArrayList<>();

                for (String child : n.terms) {
                    Tri r = evalAny(child, ctx);
                    if (r == Tri.FALSE) { anyFalse = true; break; }
                    if (r == Tri.UNKNOWN) unknownChildren.add(child);
                }
                if (anyFalse) return Set.of(); // already decided

                Set<String> blockers = new HashSet<>();
                for (String uc : unknownChildren) blockers.addAll(blockersOfAny(uc, ctx));
                return blockers;
            }

            if ("OR".equals(type)) {
                boolean anyTrue = false;
                List<String> unknownChildren = new ArrayList<>();

                for (String child : n.terms) {
                    Tri r = evalAny(child, ctx);
                    if (r == Tri.TRUE) { anyTrue = true; break; }
                    if (r == Tri.UNKNOWN) unknownChildren.add(child);
                }
                if (anyTrue) return Set.of(); // already decided

                Set<String> blockers = new HashSet<>();
                for (String uc : unknownChildren) blockers.addAll(blockersOfAny(uc, ctx));
                return blockers;
            }

            throw new IllegalArgumentException("Unsupported node type: " + n.type);
        }

        // -------- evaluation --------

        private Tri evalAny(String id, Context ctx) {
            if (id.startsWith("P")) return evalPredicate(id, ctx);
            return evalNode(id, ctx);
        }

        private Tri evalNode(String nodeId, Context ctx) {
            ExprNode n = compiled.exprNodes.get(nodeId);
            if (n == null) throw new IllegalArgumentException("Missing expr_node: " + nodeId);

            String type = safeUpper(n.type);

            if ("ATOM".equals(type)) {
                if (n.term == null) throw new IllegalArgumentException("ATOM node missing term: " + nodeId);
                return evalPredicate(n.term, ctx);
            }

            if (n.terms == null || n.terms.isEmpty()) {
                throw new IllegalArgumentException(type + " node missing terms: " + nodeId);
            }

            if ("AND".equals(type)) {
                boolean sawUnknown = false;
                for (String child : n.terms) {
                    Tri r = evalAny(child, ctx);
                    if (r == Tri.FALSE) return Tri.FALSE;
                    if (r == Tri.UNKNOWN) sawUnknown = true;
                }
                return sawUnknown ? Tri.UNKNOWN : Tri.TRUE;
            }

            if ("OR".equals(type)) {
                boolean sawUnknown = false;
                for (String child : n.terms) {
                    Tri r = evalAny(child, ctx);
                    if (r == Tri.TRUE) return Tri.TRUE;
                    if (r == Tri.UNKNOWN) sawUnknown = true;
                }
                return sawUnknown ? Tri.UNKNOWN : Tri.FALSE;
            }

            throw new IllegalArgumentException("Unsupported node type: " + n.type);
        }

        private Tri evalPredicate(String predId, Context ctx) {
            PredicateDef p = compiled.predicates.get(predId);
            if (p == null) throw new IllegalArgumentException("Missing predicate: " + predId);

            FetchGroup fg = compiled.fetchGroups.get(p.fetch_group);
            if (fg == null) throw new IllegalArgumentException("Missing fetch_group: " + p.fetch_group);

            Object v = ctx.get(fg.datasource, fg.namespace, p.field);
            if (v == null) return Tri.UNKNOWN;

            String op = (p.op == null) ? "" : p.op.trim().toLowerCase(Locale.ROOT);

            switch (op) {
                case "equal_to":
                    return Objects.equals(toComparableString(v), toComparableString(p.value)) ? Tri.TRUE : Tri.FALSE;

                case "is_empty": {
                    String s = toComparableString(v);
                    return (s == null || s.isEmpty()) ? Tri.TRUE : Tri.FALSE;
                }

                case "greater_than": {
                    BigDecimal a = toDecimal(v);
                    BigDecimal b = toDecimal(p.value);
                    if (a == null || b == null) return Tri.FALSE; // type mismatch => comparator fails
                    return (a.compareTo(b) > 0) ? Tri.TRUE : Tri.FALSE;
                }

                case "has_any_of": {
                    Set<String> choices = new HashSet<>();
                    if (p.value instanceof List<?>) {
                        for (Object o : (List<?>) p.value) choices.add(toComparableString(o));
                    } else {
                        choices.add(toComparableString(p.value));
                    }

                    if (v instanceof List<?>) {
                        for (Object o : (List<?>) v) {
                            if (choices.contains(toComparableString(o))) return Tri.TRUE;
                        }
                        return Tri.FALSE;
                    } else {
                        return choices.contains(toComparableString(v)) ? Tri.TRUE : Tri.FALSE;
                    }
                }

                default:
                    throw new IllegalArgumentException("Unsupported predicate op: " + p.op + " for " + predId);
            }
        }

        private static String safeUpper(String s) {
            return s == null ? "" : s.trim().toUpperCase(Locale.ROOT);
        }

        private static String toComparableString(Object o) {
            if (o == null) return "";
            if (o instanceof String) return (String) o;
            return String.valueOf(o).replace("\"", "");
        }

        private static BigDecimal toDecimal(Object o) {
            if (o == null) return null;
            try {
                if (o instanceof BigDecimal) return (BigDecimal) o;
                if (o instanceof Integer) return new BigDecimal((Integer) o);
                if (o instanceof Long) return new BigDecimal((Long) o);
                if (o instanceof Double) return BigDecimal.valueOf((Double) o);
                if (o instanceof Float) return BigDecimal.valueOf((Float) o);
                if (o instanceof Number) return new BigDecimal(((Number) o).toString());
                if (o instanceof String) return new BigDecimal(((String) o).trim());
                return new BigDecimal(String.valueOf(o).trim());
            } catch (Exception e) {
                return null;
            }
        }
    }

    // -------------------------
    // 4) Demo main (load compiled JSON + evaluate)
    // -------------------------

    public static void main(String[] args) throws Exception {
        // args[0] = compiled.json produced by your compiler
        File compiledFile = new File(args[0]);

        ObjectMapper mapper = new ObjectMapper()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        CompiledRule compiled = mapper.readValue(compiledFile, CompiledRule.class);

        // Build initial context from session payload (FREE)
        Context ctx = new Context();
        ctx.put("session", "customer", "status", "inactive"); // flip to "active" to allow expensive fetch

        // Implement your real fetcher here (CASGraphQL / APIgraphql calls).
        // This demo fetcher just returns mock data.
        Fetcher fetcher = (fgId, meta, currentCtx) -> {
            ContextPatch patch = new ContextPatch();

            String ds = meta.datasource;
            String ns = meta.namespace;

            if ("CASGraphQL".equalsIgnoreCase(ds) && "customer".equals(ns)) {
                patch.put(ds, ns, "daily_balance", 1000);
                patch.put(ds, ns, "age", 45);
                patch.put(ds, ns, "wealth_tier", "Executive Services");
            } else if ("CASGraphQL".equalsIgnoreCase(ds) && "audienceSegments".equals(ns)) {
                patch.put(ds, ns, "flow_id", "1000000");
                patch.put(ds, ns, "variant_id", "");
            } else if ("APIgraphql".equalsIgnoreCase(ds)) {
                // Put APIgraphql results here if your compiled rule references them
                // patch.put(ds, ns, "some_field", "some_value");
            }

            return patch;
        };

        Evaluator evaluator = new Evaluator(compiled);
        EvalOptions opts = new EvalOptions();
        opts.unknownMeansFalse = false;

        Tri result = evaluator.evaluate(ctx, fetcher, opts);
        System.out.println("Result = " + result);
    }
}
