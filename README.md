# SVG Processor

A full-stack application for uploading, processing, and visualizing SVG files containing rectangle elements.

## Features

- **Upload SVG files** - Upload SVG files via a drag-and-drop interface or file picker
- **Automatic processing** - Extract rectangle data, dimensions, and detect issues
- **Issue detection** - Identify empty SVGs and out-of-bounds rectangles
- **Interactive canvas preview** - View SVG content rendered on HTML Canvas with hover/click interactions
- **Design management** - List and view all uploaded designs with metadata

## Tech Stack

### Backend

- **Node.js** + **TypeScript**
- **Express.js** - REST API framework
- **MongoDB** + **Mongoose** - Database and ODM
- **Multer** - File upload handling
- **xml2js** - SVG parsing

### Frontend

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **React Router** - Client-side routing
- **HTML Canvas** - Interactive SVG preview

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or Docker)

## Environment Variables

### Backend

Create a `.env` file in the `backend` directory (optional):

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/svg-processor
```

| Variable      | Default                                   | Description               |
| ------------- | ----------------------------------------- | ------------------------- |
| `PORT`        | `3001`                                    | Server port               |
| `MONGODB_URI` | `mongodb://localhost:27017/svg-processor` | MongoDB connection string |

## Getting Started

### 1. Start MongoDB

#### Option A: Using Docker (Recommended)

```bash
docker run -d --name mongodb -p 27017:27017 mongo:latest
```

#### Option B: Local Installation

Make sure MongoDB is installed and running on your system:

```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Run the Application

#### Development Mode

Open two terminal windows:

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

The application will be available at:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## API Endpoints

### Upload SVG

```
POST /designs
Content-Type: multipart/form-data

Body:
- file: SVG file
```

**Response:**

```json
{
  "id": "64abc123...",
  "filename": "example.svg",
  "status": "processing",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "message": "File uploaded successfully. Processing started."
}
```

### List All Designs

```
GET /designs
```

**Response:**

```json
[
  {
    "_id": "64abc123...",
    "filename": "uuid-example.svg",
    "originalFilename": "example.svg",
    "status": "completed",
    "itemsCount": 3,
    "coverageRatio": 0.5,
    "issues": [],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Single Design

```
GET /designs/:id
```

**Response:**

```json
{
  "_id": "64abc123...",
  "filename": "uuid-example.svg",
  "originalFilename": "example.svg",
  "filePath": "/path/to/file",
  "status": "completed",
  "svgWidth": 1200,
  "svgHeight": 400,
  "items": [
    {
      "x": 50,
      "y": 80,
      "width": 300,
      "height": 120,
      "fill": "#FF0000",
      "isOutOfBounds": false
    }
  ],
  "itemsCount": 1,
  "coverageRatio": 0.075,
  "issues": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Issue Detection

The system detects the following issues:

| Issue           | Description                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| `EMPTY`         | SVG contains no rectangle elements                                                                              |
| `OUT_OF_BOUNDS` | One or more rectangles extend beyond the SVG canvas boundaries (x + width > svgWidth or y + height > svgHeight) |

## Example SVG Files

### Example A - Valid SVG

```xml
<svg width="1200" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect x="50" y="80" width="300" height="120" fill="#FF0000" />
  <rect x="400" y="100" width="500" height="200" fill="#00FF00" />
  <rect x="950" y="50" width="200" height="300" fill="#0000FF" />
</svg>
```

### Example B - Out-of-bounds Rectangle

```xml
<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect x="50" y="50" width="200" height="200" fill="#FFAA00" />
  <rect x="700" y="100" width="200" height="250" fill="#FF0000" />
</svg>
```

### Example C - Empty SVG

```xml
<svg width="600" height="300" xmlns="http://www.w3.org/2000/svg"></svg>
```

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.ts           # Express app entry point
│   │   ├── models/
│   │   │   └── Design.ts      # Mongoose schema
│   │   ├── routes/
│   │   │   └── designs.ts     # API routes
│   │   └── services/
│   │       └── svgParser.ts   # SVG parsing logic
│   ├── uploads/               # Stored SVG files
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx          # React entry point
│   │   ├── App.tsx           # Main app with routing
│   │   ├── api.ts            # API client
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── index.css         # Global styles
│   │   └── pages/
│   │       ├── UploadPage.tsx
│   │       ├── DesignsPage.tsx
│   │       └── DesignDetailPage.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## Canvas Preview Features

- **Scaled rendering** - SVG content is scaled to fit within a 600×400 canvas while preserving aspect ratio
- **Padding** - 20px padding ensures content isn't glued to edges
- **SVG boundary** - Dashed border shows the original SVG dimensions
- **Hover tooltips** - Hover over rectangles to see their properties
- **Click selection** - Click rectangles to select and view detailed information
- **Issue highlighting** - Out-of-bounds rectangles are highlighted with red dashed borders and warning indicators

## License

MIT
