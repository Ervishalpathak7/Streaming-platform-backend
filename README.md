# Streaming-platform-backend

Backend service for a video streaming platform.
Handles authentication, video uploads, asynchronous processing, and secure access to user-owned content.

This repository represents **v1.0.0** — a stable backend ready for frontend integration.

---

## Tech Stack

* **Node.js**
* **Express.js**
* **MongoDB + Mongoose**
* **Cloudinary** (video storage, HLS streaming, thumbnails)
* **JWT Authentication**
* **Multer** (temporary file uploads)
* **Winston** (structured logging)
* **Docker** (deployment-ready)

---

## Core Features

* User registration & login (JWT-based)
* Secure video upload with async processing
* HLS (`.m3u8`) streaming support
* Automatic thumbnail generation
* Video status lifecycle (`PROCESSING → READY / FAILED`)
* Fetch videos for logged-in user with pagination
* Centralized error handling
* Safe temporary file cleanup
* Structured logging with timestamps

---

## Architecture Overview

### Upload Flow

1. Client uploads video
2. File stored temporarily on disk via Multer
3. Video record created immediately with status `PROCESSING`
4. Async upload to Cloudinary (HLS + thumbnail)
5. Video metadata updated (`READY` / `FAILED`)
6. Temporary file deleted from server

This ensures:

* Non-blocking uploads
* Resilient failure handling
* Clean filesystem state

---

## API Routes

### Auth

| Method | Route                | Description       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Register new user |
| POST   | `/api/auth/login`    | Login user        |

---

### Videos

| Method | Route                | Description                          |
| ------ | -------------------- | ------------------------------------ |
| POST   | `/api/videos/upload` | Upload a new video                   |
| GET    | `/api/videos/my`     | Get videos of logged-in user         |
| GET    | `/api/videos/:id`    | Get video by ID (owner-only for now) |

---

## Pagination (Example)

```
GET /api/videos/my?page=1&limit=10
```

Response includes metadata:

```json
{
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 6,
    "totalPages": 1
  }
}
```

---

## Environment Variables

Create a `.env` file in root:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_uri

REDIS_URL = your_redis_url (leave empty if you have redis installed and you are running it locally)

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
```

---

## Running Locally

```bash
# install dependencies
npm install

# start dev server
npm run dev
```

---

## Logging

* Uses **Winston**
* Console logs for development
* Structured JSON logs (file-ready)
* Error stack traces preserved
* Timezone-aware timestamps (IST)

---

## Error Handling

* Centralized `AppError` class
* Async error wrapper
* No unhandled promise rejections
* Consistent error response format

---

## Security Notes

* JWT verified on every protected route
* Users can only access **their own videos**
* No direct file-system exposure
* Cloudinary URLs returned only when video is `READY`

---

## Versioning

* **v1.0.0**

  * Backend feature-complete
  * No video sharing
  * No public access
  * Focused on core upload & playback flow

Future versions will add:

* Video sharing
* Public/private controls
* Analytics
* Admin tools
* Caching layer (Redis)

---

## License

MIT

---

## Author

Vishal
Backend focused on correctness, scalability, and clean architecture.
