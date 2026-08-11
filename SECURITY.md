# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

## Sandbox Model

PatchProof executes PR verification scripts in an isolated worktree directory using Node.js permission flags:

- `--permission`: Enables Node.js runtime permission model.
- `--allow-fs-read`: Restricted strictly to the generated temporary worktree.
- `--allow-fs-write`: Restricted strictly to the generated temporary worktree.
- Network access and child process spawning are denied by default during repro runs.

## Reporting a Vulnerability

If you discover a security vulnerability in PatchProof, please report it via GitHub Security Advisories or open an issue directly.
