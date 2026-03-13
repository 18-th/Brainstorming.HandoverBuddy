# Brainstorming.HandoverBuddy
A 2026 Brainstorming project that handles handover of duties for people who go on leave

## Email notifications

When a handover is moved from `DRAFT` to `ACTIVE`, the API now sends notification emails to each assigned owner.

Set these environment variables to enable SMTP:

- `SMTP_HOST`
- `SMTP_PORT` (defaults to `587`)
- `SMTP_SECURE` (`true` for TLS, usually with port `465`)
- `SMTP_USER` (optional)
- `SMTP_PASS` (optional)
- `SMTP_FROM` (required sender address)

Optional fallback when GitHub public email is unavailable:

- `HANDOVER_EMAIL_DOMAIN` (sends to `<github-login>@<domain>`)

And set:

- `NEXT_PUBLIC_APP_URL` so confirmation links in emails are correct.
