# Examora — Online Examination System

Examora is a full-stack online examination platform for focused, timed multiple-choice assessments. It combines a polished React experience with role-based administration, persisted learner records, automated scoring, detailed review, downloadable achievements, collaborative cohorts and assignment scheduling, deadline reminders, and secure server-side AI assistance for assessment authors.

> **Final-release status:** The application uses Manus OAuth, tRPC, Drizzle ORM, and MySQL/TiDB. It is deployed on Manus hosting, with a public GitHub repository, responsive desktop/mobile UI, 46 automated regression tests, production builds, and a passing GitHub Actions quality gate.

## Contents

| Area | Description |
|---|---|
| [Features](#features) | Student, assessment, administration, analytics, and AI capabilities. |
| [Technology](#technology) | Frontend, backend, database, and tooling choices. |
| [Quick start](#quick-start) | Local installation and development commands. |
| [Architecture](#architecture) | Main application layers and data flow. |
| [Testing and CI](#testing-and-ci) | Automated checks and GitHub Actions workflow. |
| [Deployment](#deployment) | Production requirements and environment considerations. |

## Final release links

| Resource | Link | How to use it |
|---|---|---|
| Live Examora application | [examora-bm6y24bz.manus.space](https://examora-bm6y24bz.manus.space) | Open this URL to use the deployed full-stack product. |
| GitHub repository | [anon-443/examora-online-examination-system-](https://github.com/anon-443/examora-online-examination-system-) | View source code, README, Actions, commits, and releases. |
| GitHub Actions | [CI workflow](https://github.com/anon-443/examora-online-examination-system-/actions) | Review the automated type-check, test, and build results. |

> **GitHub Pages note:** GitHub Pages is designed for static sites. Examora requires an Express server, tRPC API, OAuth, database, scheduled deadline alerts, and server-side AI/PDF capabilities, so the complete live application is hosted at the Manus URL above rather than GitHub Pages.

## Features

### Student experience

Students can browse published assessments by subject and difficulty, enter a timed MCQ exam room, navigate between questions, flag items for later review, and see a pre-submission summary of unanswered or flagged questions. Answers are retained locally for refresh recovery and saved to the server as selections are made. The runner surfaces the timestamp of the last successful server-confirmed save, a live progress bar, and a low-time warning.

After submitting, a learner receives automatic scoring, percentage, correct/incorrect totals, detailed feedback, and a retained explanation-aware review. Learners can revisit assessment history, track performance trends, filter leaderboards, choose an accessible text-size preference, download eligible certificates and performance reports, share passing outcomes, and submit private post-exam difficulty feedback.

### Collaborative learning and practice

Practice Lab includes both a guided warm-up and launches into real persisted assessments. Learners can join instructor cohorts through invite codes, see assignment deadlines, task-status indicators, completion progress, upcoming-exam notifications, and completed outcomes. The daily deadline reminder workflow is idempotent, so qualifying learners are not sent duplicate notifications.

Instructors can create cohorts, publish or schedule assignments, inspect learner-level statuses, review completion rates and trend charts, and download cohort-ready PDF progress reports based on real assignment data.

### Administration and authoring

Administrators manage assessments, subjects, difficulty levels, questions, explanations, and publication state through protected procedures. The authoring studio can create editable AI-generated MCQ drafts from a topic, target difficulty, quantity, and an administrator-owned PDF context. AI requests, file validation, and storage operations remain server-side.

The analytics dashboard presents completed-attempt volume, average achievement, pass rate, active learners, subject performance, frequently missed questions, private learner feedback, and a CSV export of the aggregated data. Administrators can seed the two published starter assessments, manage question categories and difficulty levels, and activate or review deadline-alert status.

### Security and integrity

Authentication is handled through Manus OAuth. Student and administrator actions are protected with server-side role checks. Submitted reviews use immutable answer snapshots so later question edits do not rewrite historical results. PDF context uploads enforce MIME type, file signature, size, and administrator-owned storage-prefix checks. Client code never receives server-side AI or storage credentials.

## Technology

| Layer | Technologies |
|---|---|
| Client | React 19, TypeScript, Vite, Tailwind CSS 4, Wouter, Framer Motion, Radix/shadcn components, Recharts |
| Server | Express, tRPC 11, Zod, Manus OAuth |
| Data | Drizzle ORM with MySQL/TiDB |
| AI and files | Server-side built-in LLM integration and object storage helpers |
| Documents | jsPDF certificates and performance reports |
| Quality | TypeScript, Vitest, GitHub Actions, pnpm |

## Quick start

### Prerequisites

Use Node.js 22 or newer and pnpm 10. A MySQL/TiDB-compatible database is required for authenticated, persistent runtime features. Manus-provided OAuth, database, storage, and AI configuration are injected in the managed environment; do not commit an `.env` file containing secrets.

```bash
git clone https://github.com/anon-443/examora-online-examination-system-.git
cd examora-online-examination-system-
pnpm install --frozen-lockfile
pnpm dev
```

The application starts in development mode and serves the client and tRPC API together. In a managed project environment, sign-in uses the supplied OAuth configuration.

### Quality commands

```bash
# Static type validation
pnpm check

# Complete automated test suite
pnpm test

# Production client/server bundle
pnpm build
```

## Architecture

```text
React client
  ├─ public pages, exam runner, results, profile, leaderboard
  ├─ protected admin dashboard and analytics
  └─ typed tRPC hooks
          │
          ▼
Express + tRPC server
  ├─ OAuth context and protected/admin procedures
  ├─ assessment scoring and answer snapshots
  ├─ server-side AI/PDF context validation
  └─ document generation helpers
          │
          ▼
Drizzle ORM → MySQL/TiDB     Object storage → PDF context files
```

The primary domain models are `users`, `exams`, `questions`, `examAttempts`, `attemptAnswers`, and `examFeedback`. Attempt answers are finalized as snapshots during submission, allowing results and explanation reviews to stay consistent even when assessment content changes later.

## Testing and CI

The repository contains focused Vitest coverage for scoring, protected procedures, assessment workflows, PDF-context validation, recovery logic, analytics aggregation/CSV formatting, feedback permissions, and certificate eligibility.

The workflow at [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on pull requests and pushes to `main`. It follows pnpm’s GitHub Actions setup pattern, installs dependencies using the lockfile, and executes the same quality gates used locally.[1]

1. `pnpm check`
2. `pnpm test`
3. `pnpm build`

This is the recommended baseline for continuous integration. A deployment provider can be connected after CI succeeds; keep production deployment secrets in the provider or GitHub repository secrets rather than committing them to the repository.

## Database changes

When changing the schema, keep the TypeScript definitions and database synchronized:

```bash
pnpm drizzle-kit generate
# Review the generated SQL in drizzle/
# Apply the reviewed migration through the managed database workflow.
```

Create tables before dependent foreign keys and treat destructive migrations with care. Production examination history is user data and should not be reset for development convenience.

## Deployment

Examora is a full-stack service, not a static website. Production hosting needs a Node-compatible runtime, a MySQL/TiDB database, OAuth configuration, the required server-side AI/storage configuration, scheduled-task support, and HTTPS. GitHub Pages may host a separate static portfolio page but cannot run the Express server, tRPC procedures, authentication flow, database access, scheduled deadline workflow, or server-side AI/PDF workflows.

For the managed project, create a checkpoint and use the project publishing controls. For external hosting, configure the hosting provider’s environment variables and database connection, run the migration process, then smoke-test sign-in, an assessment attempt, result review, admin analytics, and AI/PDF authoring.

### Final deployment checklist

- [x] Public repository description and homepage link point to the final Examora release.
- [x] Production database schema and starter assessments are available.
- [x] OAuth, role checks, typed server procedures, and persistent attempts are configured.
- [x] Timed assessment, automated scoring, result review, feedback, certificates, and reports are available.
- [x] Cohorts, assignment scheduling, progress analytics, and deadline-alert workflow are active.
- [x] Desktop and mobile layouts have been visually checked.
- [x] `pnpm check`, `pnpm test`, and `pnpm build` have passed for the release.
- [x] GitHub Actions CI runs on pull requests and `main` pushes.
- [x] Live application is reachable at [examora-bm6y24bz.manus.space](https://examora-bm6y24bz.manus.space).

## Repository guidance

| File or directory | Purpose |
|---|---|
| `client/src/pages/` | Public, student, and administrator experiences. |
| `client/src/components/` | Shared UI, layout, documents, and feedback components. |
| `server/routers/` | Protected tRPC contracts for attempts and administration. |
| `server/db.ts` | Database query helpers. |
| `drizzle/schema.ts` | Source of truth for relational data definitions. |
| `shared/` | Testable assessment and analytics helpers. |
| `server/*.test.ts` | Vitest regression coverage. |
| `.github/workflows/ci.yml` | Continuous integration checks. |

## Contributing

Keep changes focused, typed, and covered by tests. Run `pnpm check && pnpm test` before opening a pull request. For UI changes, verify both desktop and mobile layouts. For server or schema changes, preserve role-based access control and assessment-history integrity.

## License

This repository is distributed under the license declared in `package.json`.

## References

[1] [pnpm documentation — Continuous Integration](https://pnpm.io/continuous-integration)
