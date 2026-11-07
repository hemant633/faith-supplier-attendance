# Faith Engineers - Online Deployment Guide

This guide explains how to deploy the **Faith Engineers Daily Supplier Attendance Portal** online so supervisors and management can access it from any mobile phone, tablet, or PC worldwide with instant Supabase database synchronization.

---

## ⚡ Architecture Overview
- **Frontend**: Lightweight SPA (HTML5, Tailwind CSS, ES6 JavaScript, Lucide Icons, Chart.js, SheetJS).
- **Backend Database**: Supabase PostgreSQL with Realtime WebSockets (`postgres_changes`) & Row-Level Security (RLS).
- **Hosting Requirements**: Pure static web hosting (HTML/CSS/JS). No Node.js or Python backend servers required!

---

## 🚀 Method 1: Netlify Drag & Drop (Easiest - 2 Minutes, 100% Free)

No Git, command line, or technical setup required:

1. Visit [app.netlify.com/drop](https://app.netlify.com/drop) (sign up for a free Netlify account).
2. Drag and drop the `Supplier Atendance` folder directly from Windows File Explorer onto the Netlify webpage:
   - Path: `C:\Users\Hemant\.antigravity-ide\Supplier Atendance`
3. Netlify will deploy your site in ~10 seconds and generate an active public HTTPS link, for example:
   `https://faith-engineers-attendance.netlify.app`
4. **Custom Domain (Optional)**:
   - In Netlify Site Settings &rarr; **Domain Management**, you can map a custom company domain such as:
     `attendance.faithengineers.com`
5. Open the link on any mobile phone. Click the **Supabase Database Icon** at the top and enter your Supabase Project URL & Anon Key.

---

## 🚀 Method 2: Vercel (Fastest Global CDN - 1-Click Deploy)

1. Create a free account at [vercel.com](https://vercel.com).
2. Install Vercel CLI (or connect via GitHub):
   ```bash
   npm i -g vercel
   cd "C:\Users\Hemant\.antigravity-ide\Supplier Atendance"
   vercel
   ```
3. Or link your GitHub repository to Vercel:
   - Push this directory to your GitHub account (`faith-supplier-attendance`).
   - In Vercel, click **Add New Project** &rarr; select the GitHub repo &rarr; click **Deploy**.
4. Vercel provides instant global CDN, automatic SSL certificate, and zero maintenance.

---

## 🚀 Method 3: GitHub Pages (Free Permanent Hosting)

1. Create a GitHub repository (e.g. `faithengineers/supplier-attendance`).
2. Push the files from `Supplier Atendance` to the `main` branch.
3. In GitHub, go to **Settings** &rarr; **Pages**:
   - Under **Build and deployment**, select **Source: Deploy from a branch**.
   - Select branch: `main` / `root`.
   - Click **Save**.
4. In ~1 minute, your site is live at:
   `https://<your-username>.github.io/supplier-attendance/`

---

## 🏢 Method 4: Hosting On-Premises on Faith Engineers Windows Server (IIS)

If Faith Engineers requires hosting within the factory local network or company intranet:

1. On the Windows Server, enable **Internet Information Services (IIS)**:
   - Control Panel &rarr; Turn Windows features on or off &rarr; Check **Internet Information Services**.
2. Open **IIS Manager**:
   - Right click **Sites** &rarr; **Add Website**.
   - Site name: `Faith-Supplier-Attendance`
   - Physical path: `C:\inetpub\wwwroot\supplier-attendance` (copy the files here).
   - Port: `80` (or `443` with SSL).
3. Add MIME type in IIS for `.json`:
   - File name extension: `.json`
   - MIME type: `application/json`
4. Now accessible to all devices on the factory Wi-Fi / VPN at `http://<server-ip>/` or `http://attendance.local/`.

---

## 🗄️ Supabase Cloud Database Checklist

Regardless of which hosting method you choose:

1. Log into your [Supabase Dashboard](https://supabase.com).
2. Go to **SQL Editor** &rarr; Open [`supabase/supabase_schema.sql`](file:///c:/Users/Hemant/.antigravity-ide/Supplier%20Atendance/supabase/supabase_schema.sql).
3. Click **Run** to generate the schema, tables, triggers, indexes, and initial data.
4. Go to **Project Settings &rarr; API** and copy:
   - **Project URL**: `https://<your-id>.supabase.co`
   - **Anon public Key**: `eyJhbGci...`
5. In the deployed web application, click the **Supabase Cloud Icon** (or settings on login page), paste these two values, and click **Test & Connect**.
6. Once connected, changes made on one phone (e.g. supervisor marking In-Time or Out-Time) automatically sync in real-time across all supervisors, managers, and admin dashboards!

