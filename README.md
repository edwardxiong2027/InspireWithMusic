# Inspire With Music

Production-oriented website, member system, volunteer administration, and
content management platform for InspireWithMusic.org.

## What works

### Public website

- Complete Home, About, Volunteers, Programs, Stories, Impact, Join, and Donate pages
- Published student stories loaded from the database
- Contact form and newsletter subscriptions saved to the database
- Webmaster-managed copy, images, leaders, programs, impact totals, donation
  details, links, organization identity, and footer information
- Responsive desktop and mobile design

### Members

- Real account registration and password login
- Salted password hashes and revocable server-side sessions
- Profile editing
- Browse open volunteer events and sign up/cancel
- Capacity enforcement and duplicate-signup prevention
- Submit service hours and review verification status
- Submit stories for Webmaster review

### Volunteer Admin

- Dedicated role with server-enforced permissions
- Create, open, close, and delete simple volunteer events
- Manage event capacity and signups
- Manage member status and profile access
- Review, verify, or reject service hours
- Cannot access Webmaster content, media, settings, or role-management APIs

### Webmaster

- All Volunteer Admin capabilities
- Edit public content by page
- Edit site identity, donation methods, links, impact numbers, youth leaders,
  program cards, and core page copy
- Upload and reuse images
- Review and publish student stories
- Read contact-form submissions
- Assign Member, Volunteer Admin, and Webmaster roles
- Manage safe AWS environment identifiers and inspect connection health
- Audit log records sensitive administrative changes

## Local setup

The application uses embedded PostgreSQL-compatible PGlite automatically for
local development. No database server is required.

```bash
npm install
npm run db:seed
npm run dev
```

Open <http://localhost:3000>.

Local seed accounts:

| Role | Email | Development password |
| --- | --- | --- |
| Webmaster | `webmaster@inspirewithmusic.org` | `ChangeMe-Webmaster-2026!` |
| Volunteer Admin | `volunteer-admin@inspirewithmusic.org` | `ChangeMe-Volunteer-2026!` |
| Member | `member@inspirewithmusic.org` | `ChangeMe-Member-2026!` |

These defaults work only for local setup. Production seeding requires explicit
password environment variables. Change every seeded password before launch.

## Commands

```bash
npm run dev          # Full working application
npm run build        # Production server build
npm run start        # Start production server
npm run build:pages  # Public static GitHub Pages preview
npm run db:init      # Create/upgrade schema
npm run db:seed      # Create initial roles and sample events
npm test
npm run lint
```

## Storage

- Local development: PGlite data under `data/` and uploaded files under `uploads/`
- AWS: Aurora/RDS PostgreSQL through `DATABASE_URL` and private S3 through
  `AWS_S3_BUCKET`
- AWS credentials are supplied through an IAM task role, never through the browser

See [infra/aws/README.md](infra/aws/README.md) for deployment and
[docs/AWS-ARCHITECTURE.md](docs/AWS-ARCHITECTURE.md) for the architecture and data model.

## GitHub Pages

GitHub Pages hosts the public visual preview only because it cannot execute a
server, authenticate users, or write database records. The working application
is the standard `npm run dev` / `npm run build` target and the same container is
deployed to AWS.
