# 我的一天 ♡ — Fully Customisable Planner v2.3

A customisable, installable student life planner.

## Included now

- Home command centre
- Day / week / month calendar
- Time-based events
- Recurring weekly classes
- Tasks with due dates, times and priorities
- Assignments with progress, status and weightage
- Exams / quizzes with countdowns
- Period logging with estimated next cycle
- Notes
- Semester progress
- Privacy mode
- Custom themes
- Custom colours and card styles
- Wallpaper uploads
- Sticker uploads and draggable stickers
- Drag-reorder dashboard widgets
- Mini planner assistant (local/rule-based)
- PWA manifest + service worker
- Mobile / tablet / desktop responsive layouts
- Export/import JSON backup

## Run it

Open `index.html`, or preferably run a local web server:

```bash
python3 -m http.server 8000
```

Then visit:

`http://localhost:8000`

## Install on iPhone / iPad

Once hosted with HTTPS:
1. Open the site in Safari.
2. Tap Share.
3. Tap **Add to Home Screen**.

## Install on Mac

Once hosted:
- Safari can add it to Dock on supported macOS versions.
- Chrome/Edge can install the PWA from the address bar/app menu.

## Important: cross-device sync

This build is fully usable but currently stores planner data on each device using browser local storage.

The code is deliberately separated so the next step can replace the local `load()` / `save()` layer with:
- Supabase (recommended)
- Firebase
- another free cloud database

That next step enables:
- one login
- phone/iPad/Mac syncing
- cloud image/sticker storage
- shared data backup
- real multi-device assistant context

## AI assistant

The included mini assistant is free and local. It can answer basic questions from saved planner data.

A true natural-language AI assistant needs an external model/API or server-side AI service. That should be connected only after authentication and cloud data are added so API keys are not exposed in the browser.


## TimeTree sync limitation

As of October 2026, TimeTree's official support documentation says TimeTree-created events cannot be exported and cannot automatically sync outward to another calendar.

Practical options:
- If your TimeTree is displaying Google Calendar / Apple Calendar events, connect/import that original external calendar instead.
- TimeTree-native events must currently be copied manually.
- This project can later add Google Calendar syncing and generic `.ics` import, but TimeTree itself does not provide an export path for its native events.


## Custom labels
Settings now includes a Label Editor. You can rename the app title, subtitle, sidebar section headers, navigation labels, dashboard widget names, and page titles. Changes are stored with the rest of your planner data.


## v2.3 customisation
- Default branding is now `我的一天 ♡` with subtitle `我的小小生活簿 ✿`.
- Upload any image as the app/sidebar icon.
- Full colour controls for page, sidebar, text, muted text, borders, accent, primary buttons, mobile bars, calendar grid lines, chat button, hero banner, and every dashboard card.
- Label Editor now covers nearly every major visible header, subheader, navigation item, page title, widget title, and quick-add button.
- All customisations persist in local storage and are included in backups.


## Supabase cloud sync enabled

This build is configured with:

- Project URL: `https://jhzxvoanehgfudlpeooc.supabase.co`
- Browser publishable key: configured in `app.js`
- Email/password authentication
- `planner_data` cloud storage
- automatic save to Supabase
- automatic load after login
- same-account sync across devices
- localStorage fallback/cache

### Required Supabase table

Run this in Supabase SQL Editor:

```sql
create table if not exists planner_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table planner_data enable row level security;

create policy "Users can view their own planner"
on planner_data for select
using (auth.uid() = user_id);

create policy "Users can insert their own planner"
on planner_data for insert
with check (auth.uid() = user_id);

create policy "Users can update their own planner"
on planner_data for update
using (auth.uid() = user_id);

create policy "Users can delete their own planner"
on planner_data for delete
using (auth.uid() = user_id);
```

If Supabase says a policy already exists, do not recreate that same policy.


## v2.5 sync troubleshooting
- Service worker cache bumped to `life-planner-v2.5`.
- Old caches are deleted on activation.
- App files now use network-first loading so GitHub updates are not stuck behind stale cache.
- Sync errors now display the exact Supabase error in a toast.
- Settings includes **Show sync diagnostics** to test session and table access.


## v2.6 class scheduling
- Classes can now be scheduled by **specific date**.
- Weekly recurring classes are still supported.
- The timetable shows the actual Monday–Sunday dates for the current week.
- Date-specific and recurring classes appear together in the timetable and calendar.


## v2.7 school-only planner
- Removed Period tracking.
- Removed personal Event / personal calendar creation.
- Existing personal-event data is hidden from the school calendar.
- Planner is now focused on classes, assignments, exams, school tasks, timetable and study notes.
- Added structured Subject Notes:
  - Subject
  - Topic
  - Notes
  - Search
  - Filter by subject
  - Edit/delete notes
- Subject notes sync through the same Supabase planner data.
