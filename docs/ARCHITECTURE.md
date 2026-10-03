# Child Development Centre v3 Architecture

## Production topology

- **Frontend:** GitHub Pages from `owusuduahephraim1/child-development-centre`.
- **Database:** dedicated Neon project `child-development-centre` (`icy-salad-56828509`).
- **Production branch:** `production` (`br-divine-shadow-b4ubcq9f`).
- **Authentication:** Neon Auth / Better Auth.
- **Browser data access:** Neon Data API with PostgreSQL RLS.
- **Media:** dedicated Cloudflare R2 bucket and Worker; migration is intentionally separate from the database restore.

The CDC stack is intentionally isolated from every Edusentia repository and Neon project.

## Security boundaries

The public repository contains only public service endpoints. It must never contain Postgres passwords, private connection strings, signing secrets, R2 credentials, or payment-provider secrets. Authorization is enforced in PostgreSQL with RLS and the `anonymous` / `authenticated` roles.

The administrator identity exists in Neon Auth and is linked to `public.admin_users`; old Auth UUIDs are never reused across projects.

## Safeguarding

Public child-identifiable media must be publication-approved and have confirmed consent. These controls are enforced both in the database model and public read policies.

## Deployment

The Pages workflow builds a static `_site` artifact and injects the CDC Neon Auth/Data API endpoints and canonical GitHub Pages URL. GitHub Pages must be enabled for the repository with **GitHub Actions** selected as the build source.

## Media migration

The restored seed intentionally retains the old public media URLs until the binary objects are copied to the new CDC-only storage. Database URLs must be rewritten only after object verification.
