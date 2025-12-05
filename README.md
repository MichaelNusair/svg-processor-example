# SVG Processor

Full-stack system for uploading, processing, and previewing SVG files with rectangle detection.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB
- **Frontend**: React, TypeScript, Vite
- **Testing**: Vitest, React Testing Library
- **Tooling**: Nx, pnpm workspaces, Docker

## Prerequisites

- **Node.js** v18+
- **pnpm** (`npm install -g pnpm`)
- **Docker** (for MongoDB)

## Quick Start

```bash
# Install dependencies
pnpm install

# Start everything (MongoDB + Backend + Frontend)
pnpm start
```

> **Tip:** For development, you may prefer running each service in its own terminal:

```bash
pnpm start:mongo      # Start MongoDB (Docker)
pnpm dev:backend      # Start backend server (port 3001)
pnpm dev:frontend     # Start frontend server (port 5173)
```

Then seed example data:

```bash
pnpm seed             # Upload example SVGs
pnpm seed:clear       # Clear existing data first
```

**Access the app:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health
- Metrics: http://localhost:3001/metrics

## Docker Compose (Full Stack)

```bash
# Start all services (MongoDB + Backend + Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Project Structure

```
├── apps/
│   ├── backend/              # Express API
│   │   └── src/
│   │       ├── config/       # Configuration
│   │       ├── controllers/  # Route handlers
│   │       ├── errors/       # Custom error classes
│   │       ├── middleware/   # Express middleware
│   │       ├── models/       # Mongoose models
│   │       ├── repositories/ # Data access layer
│   │       ├── routes/       # Route definitions
│   │       ├── services/     # Business logic
│   │       ├── test/         # Test setup
│   │       ├── utils/        # Logger, metrics
│   │       └── validators/   # Input validation
│   └── frontend/             # React SPA
│       └── src/
│           ├── components/   # UI components
│           ├── constants/    # Config values
│           ├── hooks/        # Custom hooks
│           ├── pages/        # Page components
│           ├── test/         # Test setup
│           └── utils/        # Utilities
├── libs/
│   └── shared-types/         # Shared TypeScript types
├── scripts/
│   └── seed.ts               # Data seeding script
├── examples/                 # Sample SVG files
├── docker-compose.yml        # Full stack Docker config
└── docker-compose.dev.yml    # Dev MongoDB only
```

## Development Commands

```bash
# Start services
pnpm start              # Start all (MongoDB + apps)
pnpm start:mongo        # Start MongoDB only
pnpm dev:backend        # Start backend with hot reload
pnpm dev:frontend       # Start frontend with hot reload

# Testing
pnpm test               # Run all tests
pnpm test:coverage      # Run with coverage report

# Code quality
pnpm lint               # Run ESLint
pnpm lint:fix           # Fix lint errors
pnpm format             # Format with Prettier
pnpm format:check       # Check formatting

# Data management
pnpm seed               # Upload example SVGs
pnpm seed:clear         # Clear and re-seed

# Docker
pnpm docker:up          # Start full stack
pnpm docker:down        # Stop full stack
pnpm docker:logs        # View logs

# Cleanup
pnpm clean              # Remove all node_modules
```

## Environment Variables

| Variable      | Default                                   | Description        |
| ------------- | ----------------------------------------- | ------------------ |
| `PORT`        | `3001`                                    | Backend port       |
| `MONGODB_URI` | `mongodb://localhost:27017/svg-processor` | MongoDB connection |
| `CORS_ORIGIN` | `*`                                       | CORS origin        |
| `UPLOAD_DIR`  | `./uploads` (relative to backend)         | File storage path  |
| `NODE_ENV`    | `development`                             | Environment        |

## API Endpoints

| Method   | Endpoint                 | Description             |
| -------- | ------------------------ | ----------------------- |
| `GET`    | `/health`                | Health check            |
| `GET`    | `/metrics`               | Metrics endpoint        |
| `POST`   | `/designs`               | Upload SVG              |
| `GET`    | `/designs`               | List all designs        |
| `GET`    | `/designs/:id`           | Get design details      |
| `DELETE` | `/designs/:id`           | Delete design           |
| `POST`   | `/designs/:id/reprocess` | Retry failed processing |

## Features

### Core Features

- **Upload**: Drag-and-drop SVG file upload
- **Processing**: Parse SVG, extract rectangles, detect issues
- **Preview**: Interactive canvas with hover/click on rectangles
- **Issues**: Detect empty SVGs and out-of-bounds rectangles
- **Metrics**: Coverage ratio calculation

### Production-Ready Features

- **Structured Logging**: JSON logs with correlation IDs for request tracing
- **Metrics**: Request duration, processing time, error counts
- **Retry Logic**: Automatic retry with exponential backoff for failed processing
- **Error Handling**: Typed errors with user-friendly messages
- **Size Limits**: Protection against oversized SVGs (5MB limit)
- **Timeouts**: Parser timeout protection (5s)
- **Docker Support**: Full docker-compose for production deployment

### Testing

- **SVG Parser Tests**: Coverage of all examples + edge cases
- **Hook Tests**: useAsync race conditions, useCanvasRenderer hit detection
- **Service Tests**: Design service with mocked dependencies

## SVG Format

Supports simple SVGs with `<rect>` elements:

```xml
<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect x="50" y="50" width="200" height="200" fill="#FF0000" />
</svg>
```

### Supported Features

- `width` and `height` attributes (or viewBox)
- `<rect>` elements with x, y, width, height, fill
- Fill from `fill` attribute or `style="fill:..."`
- Unit suffixes (e.g., "100px")

### Detected Issues

- **EMPTY**: No valid rectangles in SVG
- **OUT_OF_BOUNDS**: Rectangle extends beyond SVG boundaries

## Architecture Notes

### Logging & Observability

The backend uses structured logging with correlation IDs:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "message": "Request completed",
  "correlationId": "1704067200000-a1b2c3d4",
  "context": "HTTP",
  "data": {
    "method": "GET",
    "path": "/designs",
    "statusCode": 200,
    "durationMs": 15.23
  },
  "service": "svg-processor-backend",
  "environment": "production",
  "version": "1.0.0"
}
```

### Metrics

Available at `/metrics`:

- `http_requests_total`: Request count by method, path, status
- `http_request_duration_ms`: Request latency histogram
- `designs_uploaded_total`: Upload count
- `designs_processing_succeeded_total`: Success count
- `designs_processing_failed_total`: Failure count
- `svg_parsing_duration_ms`: Parse time histogram

**For production**: Replace in-memory metrics with Prometheus client (`prom-client`).

### Retry Mechanism

Failed processing automatically retries:

- Max 3 attempts
- Exponential backoff: 1s → 2s → 4s (with jitter)
- Manual reprocess via `POST /designs/:id/reprocess`

### File Storage

Raw SVG files are stored on disk while metadata lives in MongoDB.

**Scaling Note**: This works for single-server setups. For horizontal scaling, replace with S3 or similar object storage so all instances share files.

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
cd apps/backend && pnpm vitest run src/services/svgParser.test.ts
```

### Test Coverage

**Backend:**

- `svgParser.test.ts`: 30+ tests covering examples A/B/C, malformed SVGs, edge cases
- `design.service.test.ts`: Service layer with mocked dependencies

**Frontend:**

- `useAsync.test.ts`: Race condition handling, mounted state, error clearing
- `useCanvasRenderer.test.ts`: Scale calculation, hit detection, edge cases

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run `pnpm lint && pnpm test`
5. Submit a pull request

## License

MIT
