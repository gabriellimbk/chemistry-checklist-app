# V2 Summary App - Teacher + Student

Standalone build of the chemistry summary map app with a Supabase-backed student/teacher layer.

This V2 copy is separate from the currently deployed pilot version. It is intended to be the working folder for the newer teacher/student version and does not include generated audio.

## Contents

- `index.html` is the student hub app.
- `teacheradmin.html` is the teacher console served at `/teacheradmin`.
- `api/` contains the Vercel serverless routes for Supabase access.
- `topics.js` is the shared topic list used by the student and teacher shells.
- Each topic folder contains its own static app files, topic data, images, and extension questions.
- `school crest watermark.png` is used for downloadable question-board PDFs.
- `.env` and `.env.example` have been copied into this folder for local reference.

## Preview Locally

Use Vercel locally if you need the Supabase-backed API routes:

```powershell
vercel dev
```

For static-only layout checks, a simple local server is enough:

```powershell
python -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/
```

## Audio Status

No audio media files are included. Topic cards have empty `audioFile` values, so the app runs without audio.

## Deployment Note

Do not upload `.env` or API keys. The `.gitignore` keeps `.env` private while allowing `.env.example` to be tracked.

Required Vercel environment variables:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TEACHER_ADMIN_PASSWORD
TEACHER_SESSION_SECRET
```

Optional Vercel environment variable:

```text
STUDENT_SESSION_SECRET
```

If `STUDENT_SESSION_SECRET` is blank, `TEACHER_SESSION_SECRET` is used to sign student access cookies.

Canvas student links should use:

```text
/api/student-entry?id=${Canvas.user.loginId}
```

The entry route validates the student ID against Supabase, stores a signed HttpOnly cookie, and redirects to `/` so the student ID is not left visible in the app URL. The older `/?id=<student_id>` path still works as a fallback and also cleans the visible URL after validation.

Teacher access is available at:

```text
/teacheradmin
```

Flipcard mastery is stored in Supabase for the teacher statistics. Highlights remain local to the user's browser.
