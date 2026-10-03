# Deployment Status

## Dedicated infrastructure

- GitHub repository: `owusuduahephraim1/child-development-centre`
- GitHub Pages URL: `https://owusuduahephraim1.github.io/child-development-centre/`
- Neon project: `child-development-centre`
- Neon project ID: `icy-salad-56828509`
- Neon production branch: `br-divine-shadow-b4ubcq9f`
- PostgreSQL database: `neondb`
- Neon Auth: enabled
- Neon Data API: enabled
- GitHub Pages origin is trusted by Neon Auth.

This project is isolated from all Edusentia repositories and Neon projects.

## Backend restore verification

The production database currently contains:

- 31 CDC application tables
- 48 application triggers
- 57 row-level-security policies
- 60 indexes

The corrected newsletter audit functions use `audit_logs.user_id`, and gateway donation verification uses `next_receipt_reference()`.

## Remaining deployment action

GitHub must create the repository's Pages site once. The deployment workflow is already configured for GitHub Actions and has `pages: write` / `id-token: write` permissions. Once the repository Pages site is enabled, the existing workflow can deploy the site.
