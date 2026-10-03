# Child Development Centre

Standalone rebuild of the Child Development Centre website.

## Architecture

- Frontend deployment: GitHub Pages
- Database: Neon (dedicated `child-development-centre` project)
- Authentication: Neon Auth
- Data API: Neon Data API
- Media: dedicated Cloudflare R2 + Worker

This repository is intentionally isolated from all Edusentia repositories and Neon projects.

## Deployment URL

https://owusuduahephraim1.github.io/child-development-centre/

## Security

Do not commit database passwords, connection strings containing passwords, R2 credentials, payment-provider secrets, or signing keys.
