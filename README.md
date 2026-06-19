# morrow — world mood map

An anonymous, geolocated map of human emotion. Share how you are feeling right now and see thoughts from around the globe.

Built with Next.js, Leaflet, NextAuth, and Supabase.

---

## 🌟 Key Features

* **Interactive Mood Map:** A light, minimal, paper-like map design (CartoDB Positron) loaded with custom glowing pulse indicators matching the user's emotion (e.g. *happy, sad, dreamy, anxious, peaceful*).
* **IP-Based Geolocation:** Automatically resolves the user's city coordinates based on their request IP address, with fallback random world cities for private/localhost connections.
* **Live Realtime Synchronization:** Subscribes to Supabase PostgreSQL changes, delivering live note posts globally to active users.
* **Glassmorphic Toast Notifications:** A custom client-side notification stack that slides in custom-styled mood toasts when other users share thoughts.
* **Hidden Management Console:** A password-protected dashboard to monitor submissions, view analytics (breakdowns by mood/country), toggle visibility, and delete entries.
* **Automated 30-Day Cleanup:** Native database `pg_cron` routine to auto-delete entries older than 30 days.

---

## 🛠️ Tech Stack

* **Frontend:** React 19, Next.js 16 (App Router & Turbopack), Tailwind CSS 4
* **State Management:** Zustand 5
* **Mapping:** Leaflet & React Leaflet 5
* **Authentication:** NextAuth.js 4 (Credentials Provider)
* **Database & Realtime:** Supabase (PostgreSQL), `pg_cron`
* **Limiting & Security:** Upstash Redis (Sliding window rate-limiting with in-memory map fallbacks), Row Level Security (RLS)

---

## 🚀 Local Development

### 1. Clone & Install
```bash
git clone https://github.com/Lawrence1719/morrow.git
cd morrow
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and configure the variables (or reference `.env.local.bak` for the template):
```env
# Supabase Settings (Update with your actual project keys)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_PASSWORD=your-db-password

# NextAuth Settings
# Note: Commented out locally to auto-resolve hostname, required in production.
# NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-string

# Admin Credentials (For logging in)
ADMIN_EMAIL=admin@domain.com
ADMIN_PASSWORD=secure-password-here
```

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the map.

---

## 💾 Database Setup (Supabase)

Initialize your database schema by running the SQL script in [supabase/schema.sql](file:///home/rence/Documents/web-development/morrow/supabase/schema.sql) through your **Supabase Dashboard SQL Editor**:

1. **Table Structure & RLS:** Creates the `notes` table, enables Row Level Security, and applies secure select/insert rules.
2. **Enable Realtime updates:** Adds the `notes` table to the publication:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
   ```
3. **Enable Auto-Cleanup Cron:** Activates `pg_cron` to purge older entries:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;

   SELECT cron.schedule(
       'delete-old-notes-job',
       '0 0 * * *',
       $$ DELETE FROM public.notes WHERE created_at < NOW() - INTERVAL '30 days' $$
   );
   ```

---

## 🔒 Accessing the Hidden Admin Dashboard

To protect the minimal look of the landing page, the link to the admin panel is hidden. You can access it through the following methods:

1. **Direct Navigation:** Head directly to the `/admin-management` route (e.g. `http://localhost:3000/admin-management`).
2. **Keyboard Shortcut:** Press **`Ctrl + Shift + A`** simultaneously on the map.
3. **Logo Easter Egg:** Click the **"morrow"** header title in the top-left corner **5 times rapidly** (within 1 second).

---

## 🌍 Deploying to Vercel

1. Push your repository to GitHub.
2. Import the project in Vercel.
3. Add the exact environment variables configured in your local `.env`.
4. **Crucial:** Define **`NEXTAUTH_URL`** as an environment variable in Vercel settings pointing to your live URL (e.g. `https://morrow-world.vercel.app`), otherwise authentication requests will fail.
5. Deploy the project. Vercel's CI/CD pipeline will automatically build and deploy every push to the `main` branch.
