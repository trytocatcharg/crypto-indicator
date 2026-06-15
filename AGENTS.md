# AGENTS.md

## Goal

Build a small, verifiable, and evolutionary Bitcoin monitor. Its first capability is detecting Bull Market Support Band crossings and reporting them to the console.

## Project constraints

- Use Node.js, TypeScript, and Yarn. Do not use npm.
- Prefer native Node.js APIs, including `fetch`.
- Do not add Axios or dependencies that can reasonably be avoided.
- Pin every direct dependency to an exact version. Do not use `^`, `~`, `*`, or floating tags.
- Do not add Telegram, MariaDB, or Drizzle until the active feature requires them.
- Keep secrets outside the repository and document required variables in `.env.example` when they appear.
- Write code, identifiers, comments, documentation, and user-facing strings in English unless explicitly requested otherwise.
- Use conventional commits without AI attribution or `Co-Authored-By` lines.

## Architecture

- Keep indicator calculations and crossing detection as pure domain logic.
- Isolate market providers, notifiers, and persistence behind interfaces.
- Prevent Telegram, HTTP, and database details from entering the domain.
- Do not create abstractions for hypothetical requirements. Introduce them when a real external boundary or second use case exists.

## Workflow

1. Read `docs/PRODUCT.md` and `docs/ARCHITECTURE.md` before changing behavior.
2. Implement one small functional unit at a time.
3. Add tests for calculations, boundaries, and deduplication before integrating external services.
4. Run every available verification before completing a task.
5. Update documentation when scope or decisions change.

## Dependency rule

Before adding a package, document:

- the concrete problem it solves;
- why the platform or local code is insufficient;
- its maintenance and security cost;
- how its use will be verified.
