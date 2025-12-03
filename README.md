# SVG Processor

Full-stack system for uploading, processing, and previewing SVG files with rectangle detection.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB
- **Frontend**: React, TypeScript, Vite
- **Tooling**: Nx, pnpm workspaces

## Quick Start

```bash
pnpm install
pnpm start
```

This starts MongoDB (via Docker) and both frontend/backend servers.

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Project Structure

```
├── apps/
│   ├── backend/          # Express API
│   │   └── src/
│   │       ├── config/         # Configuration
│   │       ├── controllers/    # Route handlers
│   │       ├── errors/         # Error classes
│   │       ├── middleware/     # Express middleware
│   │       ├── models/         # Mongoose models
│   │       ├── repositories/   # Data access
│   │       ├── routes/         # Route definitions
│   │       ├── services/       # Business logic
│   │       ├── utils/          # Logger
│   │       └── validators/     # Input validation
│   └── frontend/         # React SPA
│       └── src/
│           ├── components/     # UI components
│           ├── constants/      # Config values
│           ├── hooks/          # Custom hooks
│           ├── pages/          # Page components
│           └── utils/          # Utilities
├── libs/
│   └── shared-types/     # Shared TypeScript types
└── examples/             # Sample SVG files
```

## Development

```bash
# Start both servers
nx run-many -t serve

# Or individually
nx serve backend   # port 3001
nx serve frontend  # port 5173
```

## Environment Variables

| Variable      | Default                                   | Description        |
| ------------- | ----------------------------------------- | ------------------ |
| `PORT`        | `3001`                                    | Backend port       |
| `MONGODB_URI` | `mongodb://localhost:27017/svg-processor` | MongoDB connection |
| `CORS_ORIGIN` | `*`                                       | CORS origin        |
| `UPLOAD_DIR`  | `./uploads` (relative to backend)         | File storage path  |

## API Endpoints

| Method   | Endpoint       | Description        |
| -------- | -------------- | ------------------ |
| `GET`    | `/health`      | Health check       |
| `POST`   | `/designs`     | Upload SVG         |
| `GET`    | `/designs`     | List all designs   |
| `GET`    | `/designs/:id` | Get design details |
| `DELETE` | `/designs/:id` | Delete design      |

## Features

- **Upload**: Drag-and-drop SVG file upload
- **Processing**: Parse SVG, extract rectangles, detect issues
- **Preview**: Interactive canvas with hover/click on rectangles
- **Issues**: Detect empty SVGs and out-of-bounds rectangles
- **Metrics**: Coverage ratio calculation

## SVG Format

Supports simple SVGs with `<rect>` elements:

```xml
<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect x="50" y="50" width="200" height="200" fill="#FF0000" />
</svg>
```

## Architecture Notes

**File Storage**: Raw SVG files are stored on disk (per assignment requirements), while metadata lives in MongoDB. This works for single-server setups but isn't horizontally scalable—multiple instances would each have their own local files.

**For production scale**: Replace local disk storage with S3 or similar object storage so all instances share the same files.
