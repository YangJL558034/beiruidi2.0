# Production deployment

## Runtime

- Use Node.js 24 LTS. The minimum supported version is Node.js 22.13.
- Run one application instance when using SQLite. Multiple instances require moving the database and rate limits to a shared database service.
- Run the application as an unprivileged service account.

## Persistent storage

Set `SZA_SQLITE_PATH` to an absolute path on a persistent volume, for example `/var/lib/sza-power/sza-power.sqlite`. The application creates backups beside it in `/var/lib/sza-power/backups`.

The current media API writes files to `public/uploads`. Bind-mount that directory to persistent storage. For multi-instance or serverless deployment, replace local uploads with object storage before scaling out.

Customer support attachments are private and must never be served by Nginx. Set `SZA_SUPPORT_ATTACHMENT_PATH` to a persistent directory outside `public`, for example `/var/lib/sza-power/support-attachments`. Database backups include a protected companion snapshot of these files.

## Environment

Set the following variables before both `npm run build` and `npm run start`:

```dotenv
NEXT_PUBLIC_SITE_URL=https://www.example.com
SZA_SESSION_SECRET=at-least-32-random-characters
SZA_ADMIN_EMAIL=admin@example.com
SZA_ADMIN_PASSWORD=a-unique-password-with-at-least-12-characters
SZA_SQLITE_PATH=/var/lib/sza-power/sza-power.sqlite
SZA_TRUSTED_ORIGINS=https://example.com,https://www.example.com
SZA_SUPPORT_ATTACHMENT_PATH=/var/lib/sza-power/support-attachments
SZA_SUPPORT_MAX_FILE_BYTES=10485760
SZA_REQUIRE_MALWARE_SCAN=true
SZA_CLAMAV_HOST=127.0.0.1
SZA_CLAMAV_PORT=3310
SZA_SMTP_HOST=smtp.example.com
SZA_SMTP_PORT=587
SZA_SMTP_USER=no-reply@example.com
SZA_SMTP_PASSWORD=use-an-app-password-or-secret-manager
SZA_SMTP_FROM=BarryT Support <no-reply@example.com>
```

`npm run start` validates these values and the database directory permissions before accepting traffic.

SMTP is required for customer registration, login verification codes, and password reset links. ClamAV is required when `SZA_REQUIRE_MALWARE_SCAN=true`; uploads fail closed if the scanner is unavailable. Keep SMTP credentials and session secrets in the server secret manager, not in source control.

## Release sequence

```sh
npm ci
npm run verify
npm run start
```

`npm run verify` is the single release gate: it runs linting, strict TypeScript checks, the production build, and the production smoke suite. The application listens on all interfaces on port 3000 so it can be reached from containers and private networks. Place Nginx in front using `deploy/nginx-site.conf`, restrict port 3000 with the host firewall or cloud security group, and expose only 80/443 publicly. Replace the example domains and certificate paths, then run `nginx -t` before reloading.

Monitor `/api/health`; it verifies both the database file and a live SQLite query. Persist and rotate the process logs, alert on HTTP 5xx, disk usage, database backup failures, and repeated login failures.

## Customer support operations

- Customers enter through `/{locale}/account`; registration is optional and public browsing/inquiries remain available without an account.
- Administrators open **在线客服**. `客服主管` can see and assign all conversations; `销售` only sees conversations assigned to that account.
- Use **接入/分配** to assign a waiting conversation, **内部备注** for staff-only information, and tags/quick replies for routing.
- Only owners can create, disable, or reset staff accounts. Temporary passwords are stored only as scrypt hashes and force a password change on first sign-in.
- Customers can export or permanently delete their own account, conversations, and private files from the customer center.
- Use **运维中心 → 数据库备份** to back up or restore both SQLite data and the companion private-attachment snapshot. A safety backup is created before every restore.
