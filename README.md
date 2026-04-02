# GBM Fest Entry Console (Next.js + MongoDB)

Centralized gate-entry web app for April 6 and April 7 fest operations.

## Features implemented

- Preloaded buyer records parsed from your PDF (`data/initial_students.json`)
- 4 admin credentials (seeded automatically)
- Search by pass number / phone number / name
- Add new buyer and edit existing buyer records
- Bulk pass preview before submit
- Bulk gate movement logging (`ENTRY` / `EXIT`)
- Operator-specific last recorded entry panel
- Centralized entry logs in MongoDB for all admins/devices
- Day selector for 6 Apr and 7 Apr
- Line-by-line text export (`data/student_records.txt`) with all current buyer records

## Default admin credentials

- `admin1` / `fest@123`
- `admin2` / `fest@123`
- `admin3` / `fest@123`
- `admin4` / `fest@123`

## Setup

1. Copy env file:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Start MongoDB (local or Atlas connection in `MONGODB_URI`).

4. Run dev server:

```bash
npm run dev
```

5. Open from phones on same Wi-Fi using your laptop IP:

```text
http://<YOUR-LAPTOP-IP>:3000
```

## Notes

- On first run, student records are seeded from `data/initial_students.json`.
- Every add/edit updates `data/student_records.txt` automatically.
- Export latest text file from dashboard: `Download Text File`.
