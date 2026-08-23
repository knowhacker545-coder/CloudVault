# ☁️ CloudVault

Secure cloud file-storage platform — authentication, upload/download, folders,
search, trash/restore, sharing links, and storage limits.

This starter is built to run **entirely for free**:
- File storage: local disk (swap for AWS S3 later — free tier is 12 months, then paid)
- Database: MongoDB Atlas free tier (512 MB)
- Backend/frontend hosting: Render / Railway / Vercel free tiers

## 1. Run it locally (free, 5 minutes)

### Prerequisites
- [Node.js](https://nodejs.org) installed
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account
  (create a free cluster → "Connect" → "Drivers" → copy the connection string)

### Steps

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and paste your MongoDB Atlas connection string into `MONGO_URI`,
and set `JWT_SECRET` to any long random string.

```bash
npm run dev
```

Server starts at **http://localhost:5000** — it also serves the frontend
(`/client`), so just open that URL in your browser. Register an account and
start uploading files (stored under `server/uploads/`).

## 2. Project structure

```
CloudVault/
├── client/        # Plain HTML/CSS/JS frontend
└── server/        # Node.js + Express + MongoDB backend
    ├── config/     # DB + storage config
    ├── models/     # User, File, Folder, Share (Mongoose schemas)
    ├── routes/      # Express routes
    ├── controllers/ # Route logic
    ├── middleware/  # JWT auth, rate limiting, error handling
    └── uploads/     # Uploaded files land here (local disk storage)
```

## 3. What's implemented

- ✅ Register / Login (bcrypt password hashing + JWT)
- ✅ Protected routes (`requireAuth` middleware)
- ✅ File upload with type + 100 MB size validation
- ✅ Per-user 10 GB storage limit (configurable via `.env`)
- ✅ Download, soft-delete (trash), restore, permanent delete
- ✅ Search by filename, category breakdown (images/videos/docs/etc.)
- ✅ Share links with expiration (1h / 1d / 7d / never)
- ✅ Rate limiting on login/register (5 attempts/min)
- ✅ Security headers via Helmet, CORS enabled

## 4. Moving to AWS S3 later (optional, for production)

Right now files are saved to `server/uploads/<userId>/...` on disk — this is
what keeps the whole thing free. When you're ready for real cloud storage:

1. Create an S3 bucket + IAM user with least-privilege access.
2. Replace the logic in `server/config/storage.js` and `server/routes/files.js`
   with the AWS SDK v3 (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`)
   to generate **presigned upload/download URLs** instead of using multer's
   disk storage — the browser then uploads directly to S3.
3. Keep MongoDB storing only metadata (filename, size, S3 key, owner) — never
   the file bytes.

## 5. Deploying for free

- **Backend**: [Render](https://render.com) free web service (Node) — connect
  your GitHub repo, set the same env vars as `.env.example`.
- **Database**: MongoDB Atlas free cluster (already used locally).
- Static frontend is already served by Express, so one Render service covers both.

## 6. Roadmap (from the original plan)

Folders UI, admin dashboard, activity log, and Docker/CI-CD are sketched in
the models/comments but not fully wired into the UI yet — the backend
(`Folder` model, `folderId` on files) is ready for you to build folder
navigation on top of.
