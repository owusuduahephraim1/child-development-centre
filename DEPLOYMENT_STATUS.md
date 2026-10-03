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
- GitHub Pages deployment: successful

This project is isolated from all Edusentia repositories and Neon projects.

## Backend restore verification

The production database currently contains:

- 31 CDC application tables
- 48 application triggers
- 57 row-level-security policies
- 60 indexes

The corrected newsletter audit functions use `audit_logs.user_id`, and gateway donation verification uses `next_receipt_reference()`.

## Deployment verification

GitHub Pages is enabled with **GitHub Actions** as the source. The deployment workflow completed successfully after Pages activation.

Live site:

`https://owusuduahephraim1.github.io/child-development-centre/`

## Remaining infrastructure work

The dedicated Cloudflare R2 media layer and Worker still need to be provisioned and connected. Existing legacy media URLs remain intentionally unchanged until the corresponding binary objects are copied and verified in the new CDC R2 bucket.
