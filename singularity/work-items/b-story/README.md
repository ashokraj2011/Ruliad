# b-story — bstory

Durable spec-driven-standard workflow state for branch `b-story`.

- [workflow.json](./workflow.json) — machine state and accepted workflow-snapshot reference
- [config/wfa/](./config/wfa/) — immutable effective policy, phase templates, and governed-agent bytes
- [STATUS.md](./STATUS.md) — human status
- [source.json](./source.json) — source context
- [USER-STORY.md](./USER-STORY.md) — manual story snapshot
- [context/test-policy.json](./context/test-policy.json) — sealed test policy and the repository's test capability at creation
- [context/repository-test-readiness.json](./context/repository-test-readiness.json) — pinned pre-code test tools and existing-failure disposition
- [documents.json](./documents.json) — supporting-document catalog (created on first upload)
- [inputs/](./inputs/) — uploaded files (created on first upload)
- [context/](./context/) — per-generation prompt-grounding audit records
- [telemetry/](./telemetry/) — sanitized per-generation model, token, and cost records
- [artifacts/](./artifacts/) — generated phase artifacts
- [approvals/](./approvals/) — append-only decisions
