# Navigation Positioning Tool — Setup Guide

This gets the tool live on a free `*.vercel.app` URL, with real data
collection into Supabase. No coding required beyond copy-pasting.
Should take about 30–45 minutes the first time.

---

## Part 1 — GitHub (where the code lives)

1. Go to https://github.com and click **Sign up**. Use any email, pick a
   username (e.g. `phildaglish` or similar — it's public).
2. Once logged in, click the **+** icon top-right → **New repository**.
3. Name it `navigation-positioning-tool`. Leave it **Public**. Don't tick
   any of the "Initialize with..." boxes. Click **Create repository**.
4. GitHub will show you a page with commands — ignore those for now if
   you're not comfortable with git command line. Instead:
   - Click **uploading an existing file** (a link on that same page).
   - Drag the entire contents of the project folder I've given you
     (everything inside `poc-tool/`, not the folder itself) into the
     browser upload box.
   - Scroll down, click **Commit changes**.

You now have the code on GitHub. You won't need to touch this again
unless you want to update the tool later (just re-upload the changed
file the same way, or ask me and I'll talk you through it).

---

## Part 2 — Supabase (where the data lives)

1. Go to https://supabase.com → **Start your project** → sign up
   (you can use your GitHub account to sign up, which saves a step).
2. Click **New project**. Give it a name (e.g. `nav-tool`), generate/set
   a database password (save this somewhere — a password manager or
   a note — you likely won't need it again but keep it just in case),
   choose the region closest to Australia (e.g. Sydney/Southeast Asia),
   click **Create new project**. Wait ~2 minutes while it provisions.
3. Once it's ready, click the **SQL Editor** icon in the left sidebar.
4. Click **New query**. Open the file `supabase-schema.sql` (included
   in this project), copy its entire contents, paste into the SQL
   editor, and click **Run**. This creates the two tables
   (`assessments` and `subscribers`) with public-insert-only security,
   meaning your website can write data but nobody can read or edit it
   except you, logged into Supabase directly.
5. Click the **Settings** (gear icon) → **API** in the left sidebar.
   You'll see two values you need:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (a long string under "Project API keys")
   Keep this browser tab open — you'll paste these into Vercel next.

---

## Part 3 — Vercel (where the live website lives)

1. Go to https://vercel.com → **Sign up** → choose **Continue with
   GitHub** (this links your accounts, which makes future updates
   automatic — when you change code on GitHub, Vercel rebuilds itself).
2. Click **Add New** → **Project**.
3. Find `navigation-positioning-tool` in the list (it's there because
   you signed up with GitHub) and click **Import**.
4. Before clicking Deploy, expand **Environment Variables** and add:
   - Name: `VITE_SUPABASE_URL` → Value: (paste the Project URL from
     Supabase)
   - Name: `VITE_SUPABASE_ANON_KEY` → Value: (paste the anon public
     key from Supabase)
5. Click **Deploy**. Wait about a minute.
6. You'll get a live URL like `navigation-positioning-tool.vercel.app`.
   Click it to test the tool end to end.

---

## Part 4 — Wix (linking to it)

1. In your Wix editor, add a **Button** element wherever you want
   (homepage, menu, etc.).
2. Click the button → **Link** → choose **Web Address** → paste your
   Vercel URL → save.
3. Set the link to open in a **New Tab** so people don't lose your
   Wix site.

That's it — the button takes visitors from Wix to the live tool on
Vercel, and every completed survey/email signup writes into your
Supabase tables.

---

## Checking your data later

Go to Supabase → **Table Editor** → click `assessments` or
`subscribers` to see rows accumulate. You can also export to CSV from
there (top-right **...** menu → **Export to CSV**) whenever you want
to analyse it in Excel or pass it to someone else.

---

## If something breaks

The most common issue is a typo in the two environment variable values
in Vercel. Double-check there's no extra space, and that you copied
the **anon public** key, not the `service_role` key (never use the
service_role key in a public website — it bypasses all security rules).
