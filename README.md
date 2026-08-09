# Inspire With Music

The public website and working volunteer platform for InspireWithMusic.org.

## Platform

- Firebase Hosting for the public site and role-based portals
- Firebase Authentication with email/password and Google accounts
- Cloud Firestore for members, roles, events, signups, hours, stories, editable content, contacts, and settings
- Cloud Storage for Firebase for webmaster image uploads
- Firestore and Storage Security Rules for member, Volunteer Admin, and Webmaster permissions

## Roles

- **Member:** signs up for events, submits service hours and stories, and edits their profile
- **Volunteer Admin:** creates volunteer events and has read-only access to submitted volunteer hours
- **Webmaster:** the protected organization account with full control of content, programs, images, members, roles, events, hours, stories, messages, and settings

The verified Firebase Authentication account using
`inspirewithmusic.org@gmail.com` is securely bootstrapped as the only
Webmaster. All other public registrations and Google sign-ins become Members.
The Webmaster can promote an account to Volunteer Admin.

## Local development

```bash
npm install
npm run dev
```

The Next.js development shell runs at `http://localhost:3000`. The deployed
Firebase build is a client-rendered application using the same components.

## Validate

```bash
npm run lint
npm test
npm run build
npm run build:firebase
```

## Firebase setup and deployment

1. Sign the Firebase CLI into the owner account:

   ```bash
   firebase login:add
   firebase login:use inspirewithmusic.org@gmail.com
   ```

2. Deploy the included configuration to enable **Email/Password** and **Google** Authentication.
3. Create the default Cloud Firestore database if it does not already exist.
4. Create Cloud Storage for Firebase. Firebase requires the Blaze plan for new
   default Storage buckets.
5. Deploy:

   ```bash
   npm run firebase:deploy
   ```

The configuration targets Firebase project `inspirewithmusic123`. Firestore
and Storage rules are deployed with the site. See
[docs/FIREBASE-ARCHITECTURE.md](docs/FIREBASE-ARCHITECTURE.md).

The production Firebase Authentication domain is `inspirewithmusic.org`, with
the same-origin OAuth callback at
`https://inspirewithmusic.org/__/auth/handler`. The default Firebase domains
remain authorized for deployment previews.

## Webmaster activation

Open the deployed site and sign in with the Google account
`inspirewithmusic.org@gmail.com`, or create an email/password account using
that address and verify it. The secure rules allow only that verified identity
to create the Webmaster profile and seed missing editable content. Production
events are created only through the administration portal; no demo records are
seeded.
