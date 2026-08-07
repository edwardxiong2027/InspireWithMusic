# AWS production architecture

The GitHub Pages build is a visual and workflow preview. Authentication, editable
content, uploads, signups, and verified service hours move to managed AWS services
for production.

## Recommended stack

- **Web app:** Next.js/React static assets in S3 behind CloudFront (or AWS Amplify
  Hosting during early releases).
- **Identity:** Amazon Cognito User Pool with `member`, `volunteer_admin`, and
  `webmaster` groups. Authorization is always checked in the API, not only in the UI.
- **API:** API Gateway HTTP API with TypeScript Lambda handlers.
- **Database:** Aurora Serverless v2 PostgreSQL through RDS Proxy. PostgreSQL keeps
  the application portable if hosting moves away from AWS later.
- **Media:** S3 uploads through short-lived presigned URLs. CloudFront serves
  optimized public images and videos.
- **Secrets:** AWS Secrets Manager for database credentials, PayPal credentials,
  email provider keys, and other sensitive values. The admin portal never receives
  secret values.
- **Email:** Amazon SES for account notices, signup confirmations, and reminders.
- **Operations:** CloudWatch logs and alarms, AWS WAF, daily database snapshots,
  and S3 versioning.

## Roles

| Capability | Member | Volunteer Admin | Webmaster |
| --- | ---: | ---: | ---: |
| View and sign up for open events | Yes | Yes | Yes |
| View own verified service hours | Yes | Yes | Yes |
| Create and manage events | No | Yes | Yes |
| Manage members, signups, and service hours | No | Yes | Yes |
| Review student stories | No | Optional | Yes |
| Edit every public page, navigation, brand, and donation method | No | No | Yes |
| Manage media and safe AWS integration settings | No | No | Yes |
| Read production secrets | No | No | No (Secrets Manager only) |

## Core data model

- `users`: Cognito subject, email, name, instrument, status, role
- `events`: title, description, location, start/end, capacity, signup state
- `event_signups`: event, member, status, created timestamp
- `service_hours`: member, event, minutes, verification status, verifier
- `pages`: slug, title, SEO fields, status, published revision
- `content_blocks`: page, type, order, localized JSON content
- `media_assets`: S3 key, alt text, dimensions, author, usage rights
- `stories`: author, body, cover media, review status, published date
- `programs`, `leaders`, `impact_metrics`, `donation_methods`, `site_settings`
- `audit_log`: actor, action, entity, before/after snapshot, timestamp

Database/AWS connection fields shown in the Webmaster preview are safe labels,
regions, bucket names, and health indicators. Credentials are deployed as server
environment references and can be rotated without changing the web app.
