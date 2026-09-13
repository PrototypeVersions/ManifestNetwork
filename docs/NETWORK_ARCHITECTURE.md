# Manifest Network Architecture

## Objective

Manifest Network extends a private local-AI application into a distributed intelligence network. The design goal is not to force users to surrender privacy in exchange for participation. Instead, each device can expose narrowly scoped, separately permissioned capabilities to the network.

The core architecture is hybrid: local inference and local preprocessing remain at the edge; massively parallel evaluation and data-generation work can be distributed; tightly coupled training can still use rented centralized GPU clusters when that is the efficient choice.

## System layers

### Personal Node
The desktop application manages local models, user conversations, hardware profiling, and personal memory. This is the trust boundary. Raw chats and files do not leave the device unless the user explicitly enables a contribution mode that requires them.

### Contribution Agent
A local service evaluates whether a network job is allowed under the user's settings. It enforces conditions such as plugged-in state, idle time, battery level, CPU/GPU limits, time windows, bandwidth limits, and data permissions.

The contribution agent supports four independent permission classes:

1. **Performance telemetry** — model name/version, hardware class, token speed, memory use, crashes, task category, and other low-sensitivity benchmark data.
2. **Compute jobs** — network-supplied evaluation, synthetic-data, inference, verification, or adapter-training jobs that do not require the user's private data.
3. **Learning packets** — locally transformed examples derived from interactions. Before upload, the node can redact obvious identifiers, classify sensitivity, and show the contribution to the user when requested.
4. **Human feedback** — optional comparisons, ratings, corrections, and adjudication.

### Network Coordinator
A central coordination service initially schedules jobs, validates node capabilities, assigns work, rate-limits abuse, and collects signed results. This can later become more federated, but a centralized coordinator is much simpler for early reliability and security.

### Manifest Commons
The Commons is a normalized, model-independent store of approved network contributions. It should distinguish source provenance, permissions, licensing constraints, quality scores, and revocation status.

Example normalized record:

```json
{
  "task_type": "python_debugging",
  "prompt": "...",
  "candidate_outputs": ["...", "..."],
  "selected_output": 1,
  "outcome": "tests_passed",
  "source_model_family": "qwen",
  "human_verified": false,
  "license_class": "approved-for-training",
  "privacy_class": "sanitized",
  "provenance_id": "pseudonymous-receipt-id"
}
```

The Commons should never treat "no username attached" as equivalent to anonymity.

### Evaluation Network
Many useful AI tasks parallelize extremely well. Manifest can distribute independent jobs across thousands of devices, including:

- benchmark execution;
- model-vs-model comparisons;
- code generation plus unit-test verification;
- synthetic task generation;
- answer ranking with evaluator models;
- safety and robustness tests;
- hardware performance profiling;
- quantization testing;
- LoRA/adapter experiments.

These jobs do not require tightly coupled GPUs and are therefore natural network workloads.

### Community Training Pipeline
Community-trained models do not require every member to run the same personal model. The pipeline is:

1. many heterogeneous models generate interactions and evaluations;
2. useful outcomes are normalized into the Commons;
3. the network filters and scores data quality;
4. Manifest selects an appropriately licensed open-weight base model;
5. training or distillation runs on rented GPU infrastructure and/or compatible distributed adapter jobs;
6. candidate releases are evaluated across the network;
7. successful models are distributed back to members.

This allows a heterogeneous open-model ecosystem to act as a teacher ensemble for community models.

### Contribution Ledger
Every accepted job can produce a signed receipt containing the type of work, measured resources, quality score, and contribution credits earned. Credits are service accounting units, not a speculative token.

Possible uses include:

- access to network inference when local hardware is insufficient;
- priority access to larger community models;
- remote agents;
- storage or synchronization services;
- other network services.

Longer-term revenue participation or cooperative patronage distributions require separate legal and governance design.

## Security and privacy model

The network should assume contributed devices are untrusted and the coordinator may also be targeted by malicious nodes. Important controls include:

- sandbox network jobs;
- sign job manifests and returned receipts;
- duplicate a sample of jobs across nodes to detect false results;
- reputation scoring based on verified work rather than identity;
- never send private member data to another member's device as a generic compute job;
- keep data permissions distinct from compute permissions;
- allow local inspection of contribution history;
- minimize uploaded metadata;
- use encryption in transit and at rest;
- build revocation/deletion semantics into the Commons where feasible.

## Phased implementation

### Phase A — Product and local controls
- Manifest Network UI and positioning.
- Separate toggles for performance, compute, learning, and human feedback.
- Local contribution preferences.
- Idle/power/resource constraints.

### Phase B — Real benchmark network
- Member/node registration with pseudonymous keys.
- Coordinator API.
- Signed benchmark jobs.
- Hardware/model telemetry.
- Contribution receipts and credits.

This is the best first real network product because it creates useful data without needing personal chats.

### Phase C — Distributed evaluation and synthetic data
- Open-model evaluation campaigns.
- Code/test verification jobs.
- Multi-model answer generation and ranking.
- Automated quality filtering.

### Phase D — Learning packets
- Local sensitivity classifier.
- Redaction and transformation pipeline.
- User review and policy controls.
- Provenance-aware Commons storage.

### Phase E — Community model releases
- Licensed base-model registry.
- Distillation/fine-tuning pipeline.
- Rented GPU training runs.
- Network-wide candidate evaluation.
- Community model catalog and updater.

### Phase F — Contribution economy
- Production credit accounting.
- Network-compute redemption.
- Governance experiments.
- Legal structure for any community revenue participation.

## Product principle

**Private intelligence should remain useful even for users who contribute nothing. Participation should be valuable because it unlocks reciprocal network benefits, not because privacy is punished.**
