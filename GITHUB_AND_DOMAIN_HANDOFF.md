# Examora — GitHub and External-Domain Handoff

## Release state

Examora is a full-stack React, Express, tRPC, and MySQL examination platform. Its identity, role-based administration, answer persistence, AI question generation, PDF-context handling, analytics, and feedback workflow require a running Node server and a database. Consequently, deploy the complete application to a compatible Node.js host with its configured database and environment variables; do **not** treat a static host as a production replacement.

| Item | Final release status |
|---|---|
| Source repository | `https://github.com/anon-443/examora-online-examination-system-` |
| Release validation | TypeScript check passed; 33 automated tests passed across 10 test files |
| Managed preview | Available through the project preview environment |
| Reusable implementation skill | `/home/ubuntu/skills/online-examination-platform/SKILL.md` |

## GitHub source upload

The project repository exists, but previous pushes and GitHub API writes returned an HTTP 403 permission error from the integration credential. The source must **not** be represented as uploaded until a push succeeds. The project has been checkpointed in the managed environment so that the complete source can be exported without relying on an unverified remote push.

To complete the upload, use the project’s **Settings → GitHub** panel and export this project to `anon-443/examora-online-examination-system-`, or authorize a GitHub token/account that has **Contents: Read and write** access to that repository. After authorization, push the current project branch and confirm that the default branch contains the release files.

## External-domain decision

> GitHub Pages publishes static HTML, CSS, and JavaScript files from a repository. It does not run Examora’s Express server, tRPC procedures, Manus OAuth flow, database operations, or server-side AI/PDF integrations.[1]

GitHub Pages can supply a free `github.io` address for a **separate static showcase**. It is not a compatible production host for this full-stack application. A real custom domain must be registered or otherwise owned; no reliable free independent custom domain can be promised. A compatible Node host plus an owned domain is the appropriate production route.

| Goal | Suitable approach | Important constraint |
|---|---|---|
| Free static portfolio/demo page | GitHub Pages at `anon-443.github.io` | Keep it separate from the full-stack app; it cannot run the server or database. |
| Full production Examora app | A Node-compatible host with managed MySQL/TiDB and environment variables | Requires a deployment target and an owned domain for a branded address. |
| Branded external domain | Register/own a domain, then connect it at the chosen host | DNS records and verification are required. |

For a GitHub Pages static companion, configure the custom domain in repository settings **before** DNS, verify ownership, and then add the provider-specific A/AAAA/ALIAS/ANAME records for an apex domain or a CNAME for a subdomain. GitHub advises against wildcard DNS and notes that DNS changes may take up to 24 hours to propagate.[2]

## Recommended next actions

First, use the project’s GitHub export panel or a credential with repository write permission to complete the source upload. Second, choose a Node-compatible external hosting provider and create its production database/environment configuration. Third, acquire the desired domain and follow that host’s DNS instructions; do not add a GitHub Pages CNAME to this full-stack repository. Finally, run a production smoke test for sign-in, an assessment attempt, admin analytics, and the AI/PDF flow.

## References

[1] [GitHub Docs — What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

[2] [GitHub Docs — Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
