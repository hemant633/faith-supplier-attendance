# Faith Engineers - Daily Supplier Attendance & Manpower Management Portal

A modern, responsive, mobile-optimized enterprise web application designed exclusively for **Faith Engineers** to streamline daily contractor and supplier manpower attendance marking, work activity tracking, manday & overtime calculations, and operational audit reports.

---

## 🚀 Key Features & Workflow

### 1. Secure Authentication & Role Management
- Access restricted exclusively to **Faith Engineers** personnel.
- **Supervisor Role**: Mark In-Time & Out-Time with mandatory activity descriptions for deployed teams.
- **Admin / Management Role**: Exclusive authorized access to Project Master, Supplier Master, Manpower Rosters, User Credentials, and Shift Calculation Rules.

#### 🔑 Pre-Configured Default Credentials:
| Role | Email / Login ID | Password | Access Level |
|---|---|---|---|
| **App Admin** | `admin@faithengineers.com` | `admin123` | Full Access (Masters, Reports, Attendance, Settings) |
| **Site Supervisor 1** | `puttraj@faithengineers.com` | `pass123` | Execution Lead (Attendance Marking & Dashboard) |
| **Site Supervisor 2** | `rajesh@faithengineers.com` | `pass123` | Site Supervisor (Attendance Marking & Dashboard) |
| **Site Supervisor 3** | `mahesh@faithengineers.com` | `pass123` | Quality & Site Sup (Attendance Marking & Dashboard) |

---

### 2. Daily Attendance Marking Process (Step-by-Step)
1. **Supervisor Login**: Enter supervisor credentials shared by the App Admin.
2. **Attendance Date Selection (Supports Past Dates)**:
   - **Defaults to Current Date** and current timing automatically.
   - Supervisors can pick any **previous date** to backfill missed shifts (e.g. yesterday or earlier).
   - **Manager Approval Requirement**: Any attendance marked for a past date (< current date) is automatically flagged as `PENDING_APPROVAL` and sent to the **Manager Approvals Queue** for executive sign-off before being approved for billing.
3. **Project Code & Location Selection**:
   - Select active Project Code from the dropdown (e.g. `FA-285`, `FA-286`, `FA-290`, `FA-301`). Completed projects are automatically hidden.
   - Select Deployment Location: **Onsite** (Customer Plant) or **Inhouse** (Faith Assembly Bays).
4. **Supplier Selection**:
   - Choose the contractor agency from the Supplier dropdown. Blocked suppliers are excluded.
5. **Mark IN Time**:
   - Automatically filters and displays **ONLY that supplier's active, unblocked employees**.
   - Select multiple worker names via checkboxes or "Select All".
   - Record Shift IN Time (defaults to current time with quick "+/-" and "Now" buttons).
   - Click **Confirm Mark IN Time** to record live working status.
6. **Mark OUT Time with Mandatory Activity Description**:
   - View currently working manpower for the selected date and project.
   - Select workers finishing duty.
   - Record Shift OUT Time.
   - **MANDATORY ACTIVITY VALIDATION**: The supervisor *must* describe the manpower activity performed (e.g., *"Fixture clamp pneumatic wiring and sensor alignment on Jig #02"*).
   - System automatically calculates **Hours Worked, Regular Mandays, OT Hours, and Payable Cost** based on employee-specific rates!

---

### 3. Masters Management (Restricted to Authorized Persons)
- **Supplier Master**: Contractor agency records with contact persons and standard billing rates.
- **Supplier Manpower List**:
  - Worker name, trade (Wireman, Fitter, Welder, Helper, Supervisor), phone number.
  - **Employee Enable / Disable Toggle**: Easily hide inactive workers from supervisor attendance screens without deleting historical logs.
  - **Custom Rates**: Set specific Manday Rates (₹/day) and Overtime (OT) Rates (₹/hr) per worker or inherit supplier defaults.
- **Project Master**: Create and manage project codes, client names, sites, and statuses.
- **Manday & OT Calculation Rules**:
  - Configurable standard shift duration (default: **8.0 hours = 1.0 Manday**).
  - Half-day threshold (default: **4.0 hours = 0.5 Manday**).
  - OT Grace period and rounding intervals (15 min, 30 min, 60 min, or exact decimal).
- **User Master**: App Admin can create new supervisor accounts and share login credentials directly.

---

### 4. Real-time Monitoring Dashboard & 6 Core Reports
- **Executive KPI Cards**: Real-time deployed headcounts, Working Now counter, Today Mandays, OT Hours, Active Suppliers, and Cost.
- **Interactive Visualizations**: Project-wise Mandays Consumption and Supplier-wise Utilisation charts powered by Chart.js.
- **6 Standard Required Reports**:
  1. **Date-wise Manpower Consumption**: Headcount, Onsite/Inhouse split, Total Hours, Regular Mandays, OT Hours, Estimated Cost.
  2. **Supplier-wise Manpower Utilisation**: Contractor roster size, active shifts deployed, mandays, and average OT.
  3. **Project-wise Manpower Consumption**: Direct manpower cost allocation and hours charged per project.
  4. **Supplier Mandays & OT Calculations for Given Duration**: Contractor billing statement with regular mandays, OT hours, rates, and total payable amount.
  5. **Unused Manpower in the System / Absenteeism**: Identifies registered workers who were absent on selected dates with absenteeism rate %.
  6. **Manpower Attendance Sheet (Project-wise & Day-wise)**: Complete muster roll register detailing In/Out times, hours, and mandatory activity performed.
- **Export Formats**: One-click **Export to Excel (`.xlsx`)**, **Export to CSV**, and **Print-Friendly PDF Muster Roll**.

---

## ⚡ Connecting to Your Supabase Database

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** and paste the contents of `supabase/supabase_schema.sql`. Run the query to create all tables, indexes, RLS policies, and seed data.
3. In Supabase, go to **Project Settings &rarr; API**:
   - Copy the **Project URL** (`https://<project-ref>.supabase.co`).
   - Copy the **anon public API Key** (`eyJhb...`).
4. In the Faith Engineers Attendance web portal, click the **Supabase Database Icon** in the top navigation bar (or on the login screen).
5. Paste your URL and Anon Key and click **Test & Connect**.
6. The system will immediately activate **Supabase Realtime WebSockets** (`postgres_changes`), enabling multi-device instant sync across all supervisors and management screens!

*(Note: If Supabase credentials are not entered yet, the application runs in 100% functional offline mode with localStorage cache and will auto-sync when connected).*

---

## 📱 Mobile Access (Android & iOS)

The application is built mobile-first with touch-friendly cards, high contrast field visibility, and a mobile bottom navigation bar.

1. Ensure your mobile phone and laptop/PC are connected to the same Wi-Fi network.
2. Run `start_supplier_attendance.bat` on your PC.
3. The terminal will display the mobile network URL:
   ```text
   Mobile Network: http://<Your-PC-IP>:8085/
   ```
4. Open Chrome or Safari on your phone and browse to that address.
5. You can also tap **"Add to Home Screen"** on your mobile browser to install it as a standalone Progressive Web App (PWA) on site!

---

## 🖥️ How to Run Locally

Double-click either of the following launcher files:
- `start_supplier_attendance.bat` (in workspace root)
- `Supplier Atendance/start_attendance_portal.bat`

This will spin up the lightweight PowerShell HTTP server and open the portal automatically in your default browser.

