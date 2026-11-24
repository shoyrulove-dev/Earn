# PureEarn on Cloudflare Workers

Worker: **earn**. Production hostname after verification: **earn.blissbiovn.com**.

## Workers Builds

- Repository: **shoyrulove-dev/Earn**. Use the repository root and Node.js 24.
- Build: `npm run cf:build`. Deploy: `npm run cf:deploy`.
- The migration branch is separate from `main` so uncommitted local changes to rewards, settlement, and admin features are not published inadvertently. Configure production Builds for `main` after reviewing and merging the migration.
- Install from the committed lockfile. Verify changes to the lockfile with npm 10.9.2, the npm version used by the current Workers Builds environment.

## Cutover checks

1. Supply existing production secrets through Cloudflare Worker secrets. Keep environment files outside Git. Preserve the NextAuth signing secret and affiliate webhook secrets when available. Set the final NextAuth URL to `https://earn.blissbiovn.com`.
2. With a separate test database, verify repeated MongoDB access, sign-in, account reads, admin lookups (including Mongoose population), and test webhooks. Verify required unique indexes on the existing production database before enabling rewards or settlement. The Worker disables per-request automatic index and collection creation.
3. Verify the settlement handler with test data before enabling the daily `15 0 * * *` Cron Trigger (07:15 Vietnam time), and ensure there will be no duplicate scheduler.
4. Replace the old Vercel record with a Workers custom-domain binding only after the preceding checks pass, and verify the domain, OAuth callback and production health after cutover.
