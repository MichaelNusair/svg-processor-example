# SVG Processor

Full-stack system for uploading, processing, and previewing SVG files with rectangle detection.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB
- **Frontend**: React, TypeScript, Vite
- **Tooling**: Nx, pnpm workspaces

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

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- MongoDB

## Setup

```bash
pnpm install
```

## Development

```bash
# Start backend (port 3001)
nx serve backend

# Start frontend (port 5173)
nx serve frontend
```

## Environment Variables

| Variable      | Default                                   | Description        |
| ------------- | ----------------------------------------- | ------------------ |
| `PORT`        | `3001`                                    | Backend port       |
| `MONGODB_URI` | `mongodb://localhost:27017/svg-processor` | MongoDB connection |
| `CORS_ORIGIN` | `*`                                       | CORS origin        |

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
