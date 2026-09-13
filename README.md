# Manifest Network

Manifest Network is a community-participating local-AI platform built on one simple idea: **your AI should run on your devices, but your device can optionally become part of something much larger.**

The local foundation remains the same: Manifest analyzes a computer, selects appropriate open-weight AI, and runs inference locally without requiring the user to manage model infrastructure. The Network layer adds an opt-in commons for distributed evaluation, idle compute, approved learning contributions, and eventually community-trained models and shared economic value.

## Product model

### 1. Personal AI Node
Your conversations, files, personal memory, and everyday inference stay local by default.

### 2. Contribution Layer
Users can independently opt into one or more contribution modes:
- **Performance data** — anonymous hardware/model benchmarks.
- **Compute** — idle CPU/GPU time for network jobs.
- **Learning** — approved, sanitized learning packets derived locally from interactions.
- **Human feedback** — occasional judgments on difficult or subjective outputs.

Compute permission and data permission are intentionally separate.

### 3. Manifest Commons
Approved contributions are normalized into a model-independent shared layer. Users may run different open-weight models; useful outcomes, evaluations, corrections, and benchmark results can still be represented in a common format.

### 4. Community Models
Manifest can eventually use the Commons to evaluate open models, generate high-quality datasets, distill successful behavior, and fine-tune appropriately licensed base models. Highly parallel work can run across participating devices, while concentrated training can use rented GPU capacity when necessary.

### 5. Contribution Economy
Participants can earn Manifest credits for useful compute, evaluation, or approved learning contributions. Credits are intended to unlock network compute and services when a user's own hardware is not enough. Longer-term community-value sharing is a design goal, subject to legal and governance structure.

## Trust principles

- Private by default.
- Raw chat sharing is off by default.
- Compute and data contribution are separate permissions.
- Users should be able to inspect what is leaving their device.
- Contribution settings should be reversible where technically possible.
- No claim that removing a name makes chat content anonymous.
- Community economics should not depend on speculative token mechanics.

## Current implementation status

The repository contains the working local Manifest desktop foundation plus a redesigned Manifest Network website and network-participation prototype. The distributed contribution backend, network scheduler, community training pipeline, and economic settlement layer are **not yet live** and are presented as product architecture rather than completed infrastructure.

The native desktop alpha still uses a compact local model and bundled llama.cpp runtime. The next implementation phase is to add real contribution-job plumbing, signed contribution receipts, hardware-safe scheduling, privacy controls, and a server-side coordination layer.

## Architecture notes

See `docs/NETWORK_ARCHITECTURE.md` for the proposed technical architecture and phased build plan.
