# Firebase architecture

## Services

- **Firebase Hosting:** deploys the Vite-generated single-page application from `out/`
- **Firebase Authentication:** email/password identity and durable browser sessions
- **Cloud Firestore:** structured application and CMS data
- **Cloud Storage:** uploaded public website imagery
- **Security Rules:** server-enforced authorization independent of the interface

## Firestore collections

- `users/{uid}` — member profile, status, and role
- `events/{eventId}` — volunteer opportunities and capacity
- `events/{eventId}/signups/{uid}` — member event signup
- `service_hours/{id}` — member hour submissions and verification status
- `stories/{id}` — student submissions and publishing workflow
- `content/{key}` — webmaster-editable public copy, metrics, program details, and image galleries
- `media_assets/{id}` — uploaded image metadata and public Storage URL
- `contact_messages/{id}` — public Join form submissions
- `newsletter_subscribers/{id}` — public newsletter signups
- `settings/site` — safe Firebase project labels and contact settings

## Authorization

Every protected Firestore and Storage request checks Firebase Authentication
and the caller's active `users/{uid}` role. Interface visibility is only a
convenience; the deployed rules enforce the actual permission boundary.

The bootstrap Webmaster path is restricted to an authenticated, email-verified
token for `inspirewithmusic.org@gmail.com`. New accounts otherwise receive the
Member role. Only a Webmaster can assign administrator roles.

## Content and programs

Default public content ships with the application so a new project renders
immediately. On the first Webmaster login, missing content documents and sample
events are written to Firestore. The Webmaster editor then controls all public
copy, timeline labels, impact metrics, program descriptions, main images, and
gallery images.
