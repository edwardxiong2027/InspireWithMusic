# Inspire With Music

A modern, youth-led nonprofit website and portal concept for
[InspireWithMusic.org](https://inspirewithmusic.org).

## Included in this preview

- Eight-section editorial homepage with original music-inspired visual system
- About, Volunteers, Programs, Stories, Impact, Join, and Donate experiences
- Responsive desktop and mobile layouts
- Member sign-in and member dashboard demo
- Simple volunteer event browsing and signup interaction
- Webmaster portal for public content, media, identity, and infrastructure settings
- Volunteer Admin portal for events, members, signups, and service hours
- Static GitHub Pages preview workflow
- AWS production architecture and PostgreSQL-oriented data model

The names, impact totals, payment details, and some profile imagery are clearly
marked demo content. A Webmaster can replace them once the production API is connected.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run build
npm run build:pages
npm run lint
```

## Preview routes

The static preview uses hash routes so every screen works on GitHub Pages:

- `#/` public homepage
- `#/stories` student stories
- `#/donate` giving page
- `#/login` member login demo (any values continue)
- `#/portal` member portal demo
- `#/admin` Webmaster / Volunteer Admin portal demo

## Production hosting

See [docs/AWS-ARCHITECTURE.md](docs/AWS-ARCHITECTURE.md) for the proposed Cognito,
API Gateway, Lambda, Aurora PostgreSQL, S3, CloudFront, SES, and Secrets Manager design.
