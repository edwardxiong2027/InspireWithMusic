# AWS production architecture

The project is a full-stack Next.js application with a PostgreSQL-compatible
data layer and a media storage provider that switches from the local filesystem
to Amazon S3 when configured.

## Production stack

- **Application:** Dockerized Next.js standalone server on AWS App Runner or ECS Fargate
- **Database:** Aurora Serverless v2 PostgreSQL or RDS PostgreSQL 16
- **Media:** Private S3 bucket accessed through the application using an IAM task role
- **Secrets:** AWS Secrets Manager for `DATABASE_URL` and any payment/email provider keys
- **Delivery:** CloudFront, AWS WAF, ACM TLS certificate, and Route 53
- **Email:** Amazon SES for account notifications and event reminders
- **Operations:** CloudWatch logs/alarms, automated RDS snapshots, S3 versioning

## Security model

Passwords are salted with a unique random value and hashed with Node.js scrypt.
Login creates a random session token; only its SHA-256 digest is stored in the
database. Browser cookies are HttpOnly, SameSite=Lax, Secure in production, and
expire after 14 days. Disabled users are rejected even if an old session exists.

Every protected API rechecks the database session and role. Volunteer Admins
cannot edit content, upload media, change roles, read contact messages, or edit
infrastructure settings. Webmasters can perform those actions. Audit records
capture administrative changes.

## Data model

- `users`, `sessions`
- `events`, `event_signups`
- `service_hours`
- `stories`
- `content_entries`
- `media_assets`
- `site_settings`
- `contact_messages`, `newsletter_subscribers`
- `audit_log`

## Configuration boundary

The Webmaster portal manages content and safe configuration values such as the
AWS region, media bucket label, sender email, and connection status. Passwords,
database credentials, AWS keys, PayPal secrets, and email-provider secrets are
never sent to the portal; they remain in Secrets Manager and IAM.

This boundary prevents a stolen Webmaster browser session from becoming an AWS
account compromise while still giving the customer control over day-to-day site
operation.
