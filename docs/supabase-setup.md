# Supabase setup for auth foundation

This branch adds a first-pass Supabase auth foundation:

- `/login`
- `/account`
- header auth state
- `proxy.ts` session refresh
- email confirmation callback at `/auth/confirm`

## 1. Create a Supabase project

In Supabase, create a new project and open:

- **Project Settings → API**
- copy:
  - `Project URL`
  - `Publishable key` (or anon key)

Official docs:
- [Supabase SSR + Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication)

## 2. Add environment variables

Create a local `.env.local` based on `.env.example`:

```bash
cp .env.example .env.local
```

Required values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY=YOUR_CLOUDFLARE_TURNSTILE_SITE_KEY
```

For Vercel, add the same variables in:

- Project Settings → Environment Variables

`NEXT_PUBLIC_TURNSTILE_SITE_KEY` is the public site key from Cloudflare
Turnstile. The Turnstile **secret key** should be configured in Supabase
Dashboard, not in your app env files.

## 3. Configure auth URLs in Supabase

In Supabase Dashboard:

- **Authentication → URL Configuration**
- set **Site URL** to your main site, for example:
  - `https://uniskill.online`
- add local and preview URLs to **Redirect URLs**, for example:
  - `http://localhost:3000/**`
  - `https://*.vercel.app/**`
  - `https://uniskill.online/**`

## 4. Update the confirmation email template

Because this app uses a server-side confirmation route, your email confirmation template should point to `/auth/confirm`.

In Supabase:

- **Authentication → Templates → Confirm signup**

Use a confirmation link shaped like:

```text
{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email
```

This matches the current app code, which already sends `/auth/confirm?next=...` as `emailRedirectTo` during sign-up.

If you later add password recovery, invite flows, or email change flows, they can reuse the same route with a different `type`.

## 5. Enable Turnstile CAPTCHA for sign-up

### Cloudflare

Create a Turnstile site in Cloudflare and copy the:

- **Site key**
- **Secret key**

Put the **Site key** into:

- `.env.local`
- Vercel environment variables

### Supabase

In Supabase Dashboard:

- **Auth → Settings / Bot and Abuse Protection → CAPTCHA**
- enable CAPTCHA
- choose **Cloudflare Turnstile**
- paste the **Secret key**

The app sign-up form sends the Turnstile token to
`supabase.auth.signUp({ options: { captchaToken } })`, and Supabase performs
the server-side verification.

## 6. Create the `profiles` table

Open the SQL Editor in Supabase and run:

- `/Users/koi/Desktop/projects/skillmarket/web/supabase/schema.sql`

This creates:

- `public.profiles`
- trigger from `auth.users`
- basic RLS policies for self-read / self-update
- profile trigger that prevents client-side role and email tampering

## 7. Create the generic comments table

Open the SQL Editor in Supabase and run:

- `/Users/koi/Desktop/projects/skillmarket/web/supabase/comments.sql`

This creates:

- `public.comments`
- generic targets for `official_skill` and `community_skill`
- RLS policies for public reads, authenticated user-owned comments, and admin moderation

If you already ran an older version of these files, it is safe to re-run both
`schema.sql` and `comments.sql` so the latest triggers and policies are applied.

The current official skill pages use `target_kind = 'official_skill'` and the
skill slug as `target_key`. Future user-uploaded skills can reuse the same table
with `target_kind = 'community_skill'`.

## 8. Create the community skill tables and storage policies

Open the SQL Editor in Supabase and run:

- `/Users/koi/Desktop/projects/skillmarket/web/supabase/community-skills.sql`

This creates:

- `public.community_skills`
- moderation statuses: `pending / approved / rejected`
- RLS for public approved rows, owner access, and admin review
- storage policies for the community upload bucket
- mixed school metadata:
  - `school_slug` for official school list entries
  - `custom_school_name` for user-provided schools not yet in the official list

## 9. Create the upload bucket

In Supabase Dashboard:

- **Storage → New bucket**
- bucket name:
  - `community-skill-files`
- access:
  - **Private bucket**

Recommended settings:

- file size limit: `1 MB`
- allowed mime types: zip / application-zip variants

## 10. Local test checklist

After env vars are set:

```bash
npm run dev
```

Then verify:

1. `/login` loads
2. sign up requires Turnstile verification
3. confirmation link lands on `/auth/confirm`
4. user is redirected to `/account`
5. header shows the signed-in email
6. logout returns to `/`
7. `/upload` accepts a `.zip` and creates a pending record
8. the uploaded `.zip` must contain `SKILL.md`
9. upload form supports:
   - official school list
   - custom school name
   - general / no-school uploads
10. admin account can approve or reject uploads in `/account`
11. approved uploads appear in `/community`

## Notes

- Official skills are still static and generated from `skills-source/`
- Community uploads now use Supabase Database + Storage
- If you already ran an older version of the SQL files, it is safe to re-run:
  - `schema.sql`
  - `comments.sql`
  - `community-skills.sql`
