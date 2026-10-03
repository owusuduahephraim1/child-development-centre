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
- Cloudflare R2 bucket: `cdc-media-production`
- Cloudflare Worker: `cdc-media`
- Cloudflare Worker URL: `https://cdc-media.edusentia-enterprise-neon.workers.dev`

The `workers.dev` account subdomain is inherited from the Cloudflare account. The CDC Worker and R2 bucket are dedicated CDC resources and are not Edusentia resources.

This project is isolated from all Edusentia repositories, Neon projects, databases, R2 buckets, and Workers.

## Backend restore verification

The production database contains:

- 31 CDC application tables
- 48 application triggers
- 57 row-level-security policies
- 60 indexes

The corrected newsletter audit functions use `audit_logs.user_id`, and gateway donation verification uses `next_receipt_reference()`.

Anonymous RLS smoke tests confirm that public content is readable while private enquiry data remains inaccessible.

## Function execution hardening

The tested least-privilege migration `database/12_function_execute_hardening.sql` has been applied to the Neon production branch.

Production verification confirms:

- Public contact, newsletter, and donation-intent RPCs remain executable by the anonymous website role.
- Administrator management RPCs remain executable by authenticated users where required.
- `admin_setup_available()` is no longer browser-executable.
- Receipt/reference helper functions are no longer browser-executable.
- `record_gateway_verified_donation(...)` is not executable by anonymous or authenticated browser roles.
- `show_db_tree()` is not executable by browser roles.
- Default function privileges now revoke automatic `PUBLIC EXECUTE` for future CDC functions in `public` and `app_private`.
- One active CDC administrator remains.
- The temporary migration branch was removed after successful production application.

## Media migration verification

- 14 legacy CDC media objects were copied to `cdc-media-production`.
- Every migrated object was downloaded through the new CDC Worker and compared byte-for-byte with its legacy source.
- 16 database media URL references were rewritten to the new Worker; two gallery covers reuse migrated gallery objects.
- The verified database scan reports zero references to `nis-cdc-media-upload.nduah385.workers.dev`.
- The media Worker health endpoint reports image, video, and multipart upload capabilities as available.

## Deployment

GitHub Pages uses **GitHub Actions** as its deployment source.

Live site:

`https://owusuduahephraim1.github.io/child-development-centre/`

Cloudflare provisioning and media-migration workflows are manual-only after successful setup.
