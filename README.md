# V2 Summary App - Teacher + Student

Standalone static build of the chemistry summary map app.

This V2 copy is separate from the currently deployed pilot version. It is intended to be the working folder for the newer teacher/student version and does not include generated audio.

## Contents

- `index.html` is the main hub app.
- Each topic folder contains its own static app files, topic data, images, and extension questions.
- `school crest watermark.png` is used for downloadable question-board PDFs.
- `.env` and `.env.example` have been copied into this folder for local reference.

## Preview Locally

Run a local static server from this folder:

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

Mastery progress and highlights are stored in the user's browser `localStorage`.
