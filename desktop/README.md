# Manifest Network Desktop

This folder contains the native Manifest Network node. It keeps the original local-AI foundation and adds the user-facing participation model for the broader network.

## Local foundation

1. **Analyze This Computer** — read CPU, memory, operating system and architecture locally.
2. **Install My AI** — download a known-good GGUF model into the app data directory.
3. **Start Manifest** — launch the bundled `llama-server` sidecar locally.
4. **Chat** — run inference on the user's machine without a per-message cloud API.

## Network direction

The desktop app now exposes a Network participation preview built around four separate permissions:

- performance intelligence;
- idle compute;
- learning contributions;
- optional human feedback.

These controls are intentionally separate so a member can contribute compute without contributing personal data.

**Important:** the contribution network is not yet connected to a production coordinator. The current alpha stores these preferences locally and demonstrates the intended product experience. No network jobs, learning packets, or credits are actually transmitted or earned yet.

## Current model

The alpha still uses a conservative Qwen2.5 1.5B Instruct Q4_K_M baseline. The long-term Manifest Network catalog will map hardware tiers to stronger and specialized models automatically.

## Development

Requirements: Node.js, Rust, Tauri system prerequisites, CMake and a staged `llama-server` sidecar in `src-tauri/binaries/` using Tauri's target-triple naming convention.

The GitHub Actions workflow in `.github/workflows/desktop-build.yml` builds a static `llama-server` and creates desktop bundles for Intel Mac, Apple Silicon Mac and Windows x64.

```bash
npm install
npm run icons
npm run tauri dev
```

## Privacy boundary

The model is downloaded from Hugging Face once. Chat inference then runs against the loopback-only bundled runtime at `127.0.0.1`. The network participation controls in this alpha are local UI preferences only and do not upload chats or contribution data.
