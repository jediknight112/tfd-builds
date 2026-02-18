# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email: **jeffrey.crane@wpengine.com**

### What to include

- A description of the vulnerability
- Steps to reproduce the issue
- Any potential impact

### Response timeline

- You should receive an acknowledgment within 48 hours.
- A fix will be prioritized based on severity.

## Scope

This policy applies to the `tfd-builds` web application. The companion `tfd-cache` service has its own security considerations.

### Client-side API keys

By design, this application exposes API keys to the browser (they are injected into the page at runtime by the Cloudflare Worker). These keys are intended for client-side use and are scoped accordingly. This is not a vulnerability.

## Supported Versions

Only the latest version deployed on the `main` branch is supported with security updates.
