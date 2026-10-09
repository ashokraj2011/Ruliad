<!--
SFlow World-Model View
source: ruliad@328a56ec5c5d91baaa4c1197147a0934b59ee0a2
source-manifest-sha256: sha256:82547a2aa824436f39fe266b3f40861b473399ac7175c65aefd104aea9c2ecde
scope-sha256: sha256:e1a4c9e6774f845725f4ede334b13e8cd3b3407dec33f961726dedf2734e3295
view: dev.impact@4
view-spec-sha256: sha256:533e81e352ca8e38a12024424901e82668735ea5a638f7d5c85e30723ca24c41
fact-ledger-sha256: sha256:f7e5da49c143c31e46ca1a1de3b78f882199f783a63f8ed1c2e6e7b81c8173a6
composer-core-sha256: sha256:e358e2b202702b74c84c32853e16130da2366d85de0189b571eb84fbf37dc5e2
composition-candidate-sha256: sha256:1f029fd6e7523fcacead1806a1db47feb474a1875114ab1b05b17cfcdaf70836
validator-sha256: sha256:c263cda0d2eca2e504cacad26b1b8de9085f2295e75ce79c00ba9af659ecceba
-->

# Development impact {#dev.impact}

**TL;DR** No registered deterministic producer supplied runtime-frequency for dev.impact@4 within the pinned scope. [F:FACT-9d9fdc8c0d7c573c]

## Changed structure {#dev.impact.changed-structure}

The bounded exact first-parent Git diff could not be read; changed-symbol extraction is unavailable. [F:FACT-96629aa432fe27bf]

The bounded exact first-parent Git diff could not be read; structural-impact extraction is unavailable. [F:FACT-c1bc92a6b6173a8f]

## Dependency impact {#dev.impact.dependency-impact}

components/index.js imports the in-scope module components/SuiteForm.js. [F:FACT-097559391ea10912]

components/index.js imports the in-scope module components/SuiteItem.js. [F:FACT-15077d9773c577c1]

main.js imports the in-scope module config.js. [F:FACT-24e1afdfda380afd]

components/index.js imports the in-scope module components/RequestForm.js. [F:FACT-3a4e38d8c33ad999]

components/index.js imports the in-scope module components/RequestItem.js. [F:FACT-3e1167d8e331f4e6]

renderer.js imports the in-scope module components/index.js. [F:FACT-450d3275fe33350c]

db.js imports the in-scope module config.js. [F:FACT-4ccfa0276c7357a8]

renderer.js imports the in-scope module db.js. [F:FACT-631c166c5185b28e]

renderer.js imports the in-scope module config.js. [F:FACT-eb8ed20c44785902]

## Affected contracts {#dev.impact.affected-contracts}

The bounded exact first-parent Git diff could not be read; contract-change extraction is unavailable. [F:FACT-a2fd88ef2de3e50b]

## Test impact {#dev.impact.test-impact}

The bounded exact first-parent Git diff could not be read; test-impact extraction is unavailable. [F:FACT-597f6653f12a88ee]

## Unavailable analysis {#dev.impact.unavailable-analysis}

No registered deterministic producer supplied runtime-frequency for dev.impact@4 within the pinned scope. [F:FACT-9d9fdc8c0d7c573c]

## Facts {#dev.impact.facts}

```json
{
  "fact_ledger_sha256": "sha256:f7e5da49c143c31e46ca1a1de3b78f882199f783a63f8ed1c2e6e7b81c8173a6",
  "facts": [
    {
      "assurance": "structurally-derived",
      "claim": "components/index.js imports the in-scope module components/SuiteForm.js.",
      "claimSha256": "sha256:5f5b8c28d79692f3e6c43f73da8d8e336a78c15a85480fb650c14773e16df969",
      "conflictsWith": [],
      "derivationId": "DRV-8de74d369b3fc926",
      "evidenceIds": [
        "EV-be034e0ae78d5042"
      ],
      "factSha256": "sha256:230b9f79b00634d728aa39a823ccb4032394f9331d4f8481dd1da9669dd20c54",
      "factType": "dependency-edge",
      "id": "FACT-097559391ea10912",
      "scopeStatus": "inside",
      "status": "available",
      "subject": {
        "id": "components/index.js->components/SuiteForm.js",
        "kind": "dependency-edge"
      }
    },
    {
      "assurance": "structurally-derived",
      "claim": "components/index.js imports the in-scope module components/SuiteItem.js.",
      "claimSha256": "sha256:ad2e29bdacd982f80c96e6b1e99c9485af3e72f63175a8e474044a45ca71e619",
      "conflictsWith": [],
      "derivationId": "DRV-8de74d369b3fc926",
      "evidenceIds": [
        "EV-30ee4afa039d7bfb"
      ],
      "factSha256": "sha256:e3ed7db16dee0e55705b82ac89cfbf4990010126f56b4922e48815529808b68b",
      "factType": "dependency-edge",
      "id": "FACT-15077d9773c577c1",
      "scopeStatus": "inside",
      "status": "available",
      "subject": {
        "id": "components/index.js->components/SuiteItem.js",
        "kind": "dependency-edge"
      }
    },
    {
      "assurance": "structurally-derived",
      "claim": "main.js imports the in-scope module config.js.",
      "claimSha256": "sha256:b92dbf29d9004bc38c22f870d323b11bbecb3796a3fdbc8c60b0dd7fdbacf6d5",
      "conflictsWith": [],
      "derivationId": "DRV-8de74d369b3fc926",
      "evidenceIds": [
        "EV-bd4b3669d82bb21c"
      ],
      "factSha256": "sha256:28c57bbf55703e669e726e855b40f7eb0edd0f731eff385d02332e2521aeb76d",
      "factType": "dependency-edge",
      "id": "FACT-24e1afdfda380afd",
      "scopeStatus": "inside",
      "status": "available",
      "subject": {
        "id": "main.js->config.js",
        "kind": "dependency-edge"
      }
    },
    {
      "assurance": "structurally-derived",
      "claim": "components/index.js imports the in-scope module components/RequestForm.js.",
      "claimSha256": "sha256:8125af0aba0ef05a8854b484e86f0ecdee71413009d01613a9bad43e920a3854",
      "conflictsWith": [],
      "derivationId": "DRV-8de74d369b3fc926",
      "evidenceIds": [
        "EV-8e5fe750ed0675d4"
      ],
      "factSha256": "sha256:d164e0d0ae8ec743d0b7d0915f69f6ad99f357eb36cc5f7e3eaaaa6e84bdfdde",
      "factType": "dependency-edge",
      "id": "FACT-3a4e38d8c33ad999",
      "scopeStatus": "inside",
      "status": "available",
      "subject": {
        "id": "components/index.js->components/RequestForm.js",
        "kind": "dependency-edge"
      }
    },
    {
      "assurance": "structurally-derived",
      "claim": "components/index.js imports the in-scope module components/RequestItem.js.",
      "claimSha256": "sha256:a7b79579378ad3a137a101beeea68b50870fa2784b833eaeadc7f4a099973cf4",
      "conflictsWith": [],
      "derivationId": "DRV-8de74d369b3fc926",
      "evidenceIds": [
        "EV-0a996294e3aa5fd7"
      ],
      "factSha256": "sha256:1c66fdabfc316f8e6c0293baac94f15a61aa8e6cd12ae63b8b134b70a578e59c",
      "factType": "dependency-edge",
      "id": "FACT-3e1167d8e331f4e6",
      "scopeStatus": "inside",
      "status": "available",
      "subject": {
        "id": "components/index.js->components/RequestItem.js",
        "kind": "dependency-edge"
      }
    },
    {
      "assurance": "structurally-derived",
      "claim": "renderer.js imports the in-scope module components/index.js.",
      "claimSha256": "sha256:00341fe7a3cc491fe42826ec508300f9f5f4d811cc3815746fcc12fddd1a2f02",
      "conflictsWith": [],
      "derivationId": "DRV-8de74d369b3fc926",
      "evidenceIds": [
        "EV-40e3cbd98e18d7e6"
      ],
      "factSha256": "sha256:7ea0ddab22a3ea4bdb51114adcaaacf1d95c43b19001fb1eb25053174be0a855",
      "factType": "dependency-edge",
      "id": "FACT-450d3275fe33350c",
      "scopeStatus": "inside",
      "status": "available",
      "subject": {
        "id": "renderer.js->components/index.js",
        "kind": "dependency-edge"
      }
    },
    {
      "assurance": "structurally-derived",
      "claim": "db.js imports the in-scope module config.js.",
      "claimSha256": "sha256:e8ce824772f607e9cd2de70da5bd8c7d0cfe9fe86c6e98d2c77bcba4a7ab8b5a",
      "conflictsWith": [],
      "derivationId": "DRV-8de74d369b3fc926",
      "evidenceIds": [
        "EV-5923f19675665dbb"
      ],
      "factSha256": "sha256:3e20c9ed9f3b9447537b4866d4b04cc465f180b505ac75b986765ebe94165d4b",
      "factType": "dependency-edge",
      "id": "FACT-4ccfa0276c7357a8",
      "scopeStatus": "inside",
      "status": "available",
      "subject": {
        "id": "db.js->config.js",
        "kind": "dependency-edge"
      }
    },
    {
      "assurance": "not-applicable",
      "claim": null,
      "claimSha256": "sha256:38e0b9de817f645c4bec37c0d4a3e58baecccb040f5718dc069a72c7385a0bed",
      "conflictsWith": [],
      "derivationId": "DRV-30452d23dfcc0997",
      "evidenceIds": [],
      "factSha256": "sha256:d8c9adfa16557788cb290bd98513ef0ca2e42cd9ac785e824d620cc3f702e1e5",
      "factType": "test-impact",
      "id": "FACT-597f6653f12a88ee",
      "reason": {
        "attemptedProducer": "change-region",
        "code": "PARSE_FAILURE",
        "detail": "The bounded exact first-parent Git diff could not be read; test-impact extraction is unavailable."
      },
      "scopeStatus": "inside",
      "status": "unavailable",
      "subject": {
        "id": "change-region:test-impact",
        "kind": "test"
      }
    },
    {
      "assurance": "structurally-derived",
      "claim": "renderer.js imports the in-scope module db.js.",
      "claimSha256": "sha256:e35c27f43256afc48a58d2d92093bb44a4d3f598ce612a3b502704f740dbdadf",
      "conflictsWith": [],
      "derivationId": "DRV-8de74d369b3fc926",
      "evidenceIds": [
        "EV-002cbac373d2d4a4"
      ],
      "factSha256": "sha256:be8abe65c20a65645afc2c488f8b430bd135f397c5d1ae1ba9552bba62d78cf6",
      "factType": "dependency-edge",
      "id": "FACT-631c166c5185b28e",
      "scopeStatus": "inside",
      "status": "available",
      "subject": {
        "id": "renderer.js->db.js",
        "kind": "dependency-edge"
      }
    },
    {
      "assurance": "not-applicable",
      "claim": null,
      "claimSha256": "sha256:38e0b9de817f645c4bec37c0d4a3e58baecccb040f5718dc069a72c7385a0bed",
      "conflictsWith": [],
      "derivationId": "DRV-30452d23dfcc0997",
      "evidenceIds": [],
      "factSha256": "sha256:9101713c6007d9d0da19d1caf19ca23a03ffe581d395e24860184b080b51bc00",
      "factType": "changed-symbol",
      "id": "FACT-96629aa432fe27bf",
      "reason": {
        "attemptedProducer": "change-region",
        "code": "PARSE_FAILURE",
        "detail": "The bounded exact first-parent Git diff could not be read; changed-symbol extraction is unavailable."
      },
      "scopeStatus": "inside",
      "status": "unavailable",
      "subject": {
        "id": "change-region:changed-symbol",
        "kind": "symbol"
      }
    },
    {
      "assurance": "not-applicable",
      "claim": null,
      "claimSha256": "sha256:38e0b9de817f645c4bec37c0d4a3e58baecccb040f5718dc069a72c7385a0bed",
      "conflictsWith": [],
      "derivationId": "DRV-dde8f3b531fae5f3",
      "evidenceIds": [],
      "factSha256": "sha256:5e8b07dd78b13a241a2822e5e2505035c444e79b93bf774c5d4e329b58c14857",
      "factType": "runtime-frequency",
      "id": "FACT-9d9fdc8c0d7c573c",
      "reason": {
        "attemptedProducer": "required-fact-coverage",
        "code": "NO_RUNTIME_EVIDENCE",
        "detail": "No registered deterministic producer supplied runtime-frequency for dev.impact@4 within the pinned scope."
      },
      "scopeStatus": "inside",
      "status": "unavailable",
      "subject": {
        "id": "dev.impact@4:runtime-frequency",
        "kind": "analysis"
      }
    },
    {
      "assurance": "not-applicable",
      "claim": null,
      "claimSha256": "sha256:38e0b9de817f645c4bec37c0d4a3e58baecccb040f5718dc069a72c7385a0bed",
      "conflictsWith": [],
      "derivationId": "DRV-30452d23dfcc0997",
      "evidenceIds": [],
      "factSha256": "sha256:3b22fd1673aa34c31c787eb88439ae4904560fad6a529d62b19df28428ed4848",
      "factType": "contract-change",
      "id": "FACT-a2fd88ef2de3e50b",
      "reason": {
        "attemptedProducer": "change-region",
        "code": "PARSE_FAILURE",
        "detail": "The bounded exact first-parent Git diff could not be read; contract-change extraction is unavailable."
      },
      "scopeStatus": "inside",
      "status": "unavailable",
      "subject": {
        "id": "change-region:contract-change",
        "kind": "contract"
      }
    },
    {
      "assurance": "not-applicable",
      "claim": null,
      "claimSha256": "sha256:38e0b9de817f645c4bec37c0d4a3e58baecccb040f5718dc069a72c7385a0bed",
      "conflictsWith": [],
      "derivationId": "DRV-30452d23dfcc0997",
      "evidenceIds": [],
      "factSha256": "sha256:1ca96cd2528a27e593dc7b7fbbc96aa2603e11dea4bda9d67b05295ed3004774",
      "factType": "structural-impact",
      "id": "FACT-c1bc92a6b6173a8f",
      "reason": {
        "attemptedProducer": "change-region",
        "code": "PARSE_FAILURE",
        "detail": "The bounded exact first-parent Git diff could not be read; structural-impact extraction is unavailable."
      },
      "scopeStatus": "inside",
      "status": "unavailable",
      "subject": {
        "id": "change-region:structural-impact",
        "kind": "analysis"
      }
    },
    {
      "assurance": "structurally-derived",
      "claim": "renderer.js imports the in-scope module config.js.",
      "claimSha256": "sha256:e348f08ae6214cff69821259f3fc5fcb5978168e8acf1fb6c4a5a982681eef82",
      "conflictsWith": [],
      "derivationId": "DRV-8de74d369b3fc926",
      "evidenceIds": [
        "EV-44213beda9cda97b"
      ],
      "factSha256": "sha256:ada8d4116251e825de022ed91bcedf349fe5f87d2aab54a0db26def5a45b947e",
      "factType": "dependency-edge",
      "id": "FACT-eb8ed20c44785902",
      "scopeStatus": "inside",
      "status": "available",
      "subject": {
        "id": "renderer.js->config.js",
        "kind": "dependency-edge"
      }
    }
  ],
  "schema_version": 1,
  "scope_sha256": "sha256:e1a4c9e6774f845725f4ede334b13e8cd3b3407dec33f961726dedf2734e3295",
  "view": "dev.impact",
  "view_spec_sha256": "sha256:533e81e352ca8e38a12024424901e82668735ea5a638f7d5c85e30723ca24c41",
  "view_version": 4
}
```
---
generated-at: 2026-10-09T06:59:40.387Z
source-commit: 328a56ec5c5d91baaa4c1197147a0934b59ee0a2
view-sha256: sha256:8d288068f06d61ea0f2088396b7a03ca91dc2d8fab8827ce8e6524ed997d5966
prompt-sha256: sha256:1c348ca3bce3b3226ad97f0020448df8ab061de9dae102d64876e9764fd69829
execution-unit: governed-model-composer@1:ewogICJwcm92aWRlciI6ICJjb3BpbG90LWNsaSIsCiAgInJlcXVlc3RlZE1vZGVsIjogInByb3ZpZGVyLWF1dG8iCn0K:038d3a21-97a8-4989-86f9-1e1f493fbab1
model: auto
assurance: validated-derived-view
---
