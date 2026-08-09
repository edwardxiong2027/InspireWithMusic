# Firebase architecture

## Services

- **Firebase Hosting:** deploys the Vite-generated single-page application from `out/`
- **Firebase Authentication:** email/password and Google identity with durable browser sessions
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
token for `inspirewithmusic.org@gmail.com`, and the organization account cannot
be demoted or deactivated. New accounts otherwise receive the Member role. The
Webmaster can assign the narrowly scoped Volunteer Admin role, which can create
events and read submitted hours but cannot edit events, approve hours, manage
members, or change website content.

## Content and programs

Default public content ships with the application so a new project renders
immediately. On the first Webmaster login, missing content documents are
written to Firestore. No sample member, event, or hour records are created in
production. The Webmaster editor then controls all public
copy, timeline labels, impact metrics, program descriptions, main images, and
gallery images.
