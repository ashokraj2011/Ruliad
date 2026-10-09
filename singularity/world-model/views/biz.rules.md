<!--
SFlow World-Model View
source: ruliad@328a56ec5c5d91baaa4c1197147a0934b59ee0a2
source-manifest-sha256: sha256:82547a2aa824436f39fe266b3f40861b473399ac7175c65aefd104aea9c2ecde
scope-sha256: sha256:e1a4c9e6774f845725f4ede334b13e8cd3b3407dec33f961726dedf2734e3295
view: biz.rules@4
view-spec-sha256: sha256:39cca8832e285cb7fd7b7b5a09deca629602e2c303908e0aace6032ccf2680b1
fact-ledger-sha256: sha256:377b18771c27ffaec132f0daaa0778ae59b65caacb298c02bf836465c516c403
composer-core-sha256: sha256:e358e2b202702b74c84c32853e16130da2366d85de0189b571eb84fbf37dc5e2
composition-candidate-sha256: sha256:83be96a0602ca162a868e95bc57930a77033ba3f5fe5b8ac93972e27effb9ef8
validator-sha256: sha256:c263cda0d2eca2e504cacad26b1b8de9085f2295e75ce79c00ba9af659ecceba
-->

# Business rules {#biz.rules}

**TL;DR** No registered deterministic producer supplied rule-definition for biz.rules@4 within the pinned scope. [F:FACT-6242549f4c409e7f]

No registered deterministic producer supplied business-meaning for biz.rules@4 within the pinned scope. [F:FACT-d0f9fe2b4d4a5434]

## Registered rules {#biz.rules.registered-rules}

No registered deterministic producer supplied rule-definition for biz.rules@4 within the pinned scope. [F:FACT-6242549f4c409e7f]

## Conditions and outcomes {#biz.rules.conditions-and-outcomes}



## Rule locations {#biz.rules.rule-locations}



## Conflicts and unavailable meaning {#biz.rules.conflicts-and-unavailable-meaning}

No registered deterministic producer supplied business-meaning for biz.rules@4 within the pinned scope. [F:FACT-d0f9fe2b4d4a5434]

## Facts {#biz.rules.facts}

```json
{
  "fact_ledger_sha256": "sha256:377b18771c27ffaec132f0daaa0778ae59b65caacb298c02bf836465c516c403",
  "facts": [
    {
      "assurance": "not-applicable",
      "claim": null,
      "claimSha256": "sha256:38e0b9de817f645c4bec37c0d4a3e58baecccb040f5718dc069a72c7385a0bed",
      "conflictsWith": [],
      "derivationId": "DRV-dde8f3b531fae5f3",
      "evidenceIds": [],
      "factSha256": "sha256:b39efbffe39a2e766d1be30c87920a8aa7d5c34d3ce648ab0e5537628484fcb1",
      "factType": "rule-definition",
      "id": "FACT-6242549f4c409e7f",
      "reason": {
        "attemptedProducer": "required-fact-coverage",
        "code": "NO_REGISTERED_PRODUCER",
        "detail": "No registered deterministic producer supplied rule-definition for biz.rules@4 within the pinned scope."
      },
      "scopeStatus": "inside",
      "status": "unavailable",
      "subject": {
        "id": "biz.rules@4:rule-definition",
        "kind": "analysis"
      }
    },
    {
      "assurance": "not-applicable",
      "claim": null,
      "claimSha256": "sha256:38e0b9de817f645c4bec37c0d4a3e58baecccb040f5718dc069a72c7385a0bed",
      "conflictsWith": [],
      "derivationId": "DRV-dde8f3b531fae5f3",
      "evidenceIds": [],
      "factSha256": "sha256:191517d5ee54d630093cc095035a573b78f9bb9075bfadfa3a93ae559f431238",
      "factType": "business-meaning",
      "id": "FACT-d0f9fe2b4d4a5434",
      "reason": {
        "attemptedProducer": "required-fact-coverage",
        "code": "NO_REGISTERED_PRODUCER",
        "detail": "No registered deterministic producer supplied business-meaning for biz.rules@4 within the pinned scope."
      },
      "scopeStatus": "inside",
      "status": "unavailable",
      "subject": {
        "id": "biz.rules@4:business-meaning",
        "kind": "analysis"
      }
    }
  ],
  "schema_version": 1,
  "scope_sha256": "sha256:e1a4c9e6774f845725f4ede334b13e8cd3b3407dec33f961726dedf2734e3295",
  "view": "biz.rules",
  "view_spec_sha256": "sha256:39cca8832e285cb7fd7b7b5a09deca629602e2c303908e0aace6032ccf2680b1",
  "view_version": 4
}
```
---
generated-at: 2026-10-09T06:59:40.387Z
source-commit: 328a56ec5c5d91baaa4c1197147a0934b59ee0a2
view-sha256: sha256:06a53aced48d589cf552c6e6be46cc88525a54261a4c1343607d085af08e8944
prompt-sha256: sha256:c5121d2f9a50a174db554f489693d4e6ee65d0286871d9e9fd286d6c615265ec
execution-unit: governed-model-composer@1:ewogICJwcm92aWRlciI6ICJjb3BpbG90LWNsaSIsCiAgInJlcXVlc3RlZE1vZGVsIjogInByb3ZpZGVyLWF1dG8iCn0K:5dcb2f46-9bf0-4c48-a139-457743a0e051
model: auto
assurance: validated-derived-view
---
