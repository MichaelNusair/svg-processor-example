#!/usr/bin/env tsx
/**
 * Seed Script - Upload example SVG files for testing
 *
 * Usage:
 *   pnpm seed                    # Seed with default examples
 *   pnpm seed --clear            # Clear existing designs first
 *
 * This script:
 * 1. Uploads all SVG files from the examples/ directory
 * 2. Waits for processing to complete
 * 3. Reports results
 *
 * Prerequisites:
 * - MongoDB must be running
 * - Backend server must be running on port 3001
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXAMPLES_DIR = path.join(__dirname, '..', 'examples');
const API_BASE = process.env.API_URL || 'http://localhost:3001';

interface UploadResponse {
  id: string;
  filename: string;
  status: string;
  message: string;
}

interface Design {
  _id: string;
  filename: string;
  status: string;
  itemsCount: number;
  issues: string[];
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(message: string, color: string = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkServer(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

async function clearDesigns(): Promise<void> {
  log('\n🗑️  Clearing existing designs...', colors.yellow);

  const response = await fetch(`${API_BASE}/designs`);
  const designs = (await response.json()) as Design[];

  for (const design of designs) {
    await fetch(`${API_BASE}/designs/${design._id}`, { method: 'DELETE' });
    log(`   Deleted: ${design.filename}`, colors.dim);
  }

  log(`   Cleared ${designs.length} designs`, colors.green);
}

async function uploadFile(filePath: string): Promise<UploadResponse> {
  const fileName = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath);

  const formData = new FormData();
  formData.append(
    'file',
    new Blob([fileContent], { type: 'image/svg+xml' }),
    fileName
  );

  const response = await fetch(`${API_BASE}/designs`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload ${fileName}: ${response.statusText}`);
  }

  return response.json() as Promise<UploadResponse>;
}

async function waitForProcessing(
  id: string,
  maxWaitMs: number = 10000
): Promise<Design> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`${API_BASE}/designs/${id}`);
    const design = (await response.json()) as Design;

    if (design.status === 'completed' || design.status === 'error') {
      return design;
    }

    await sleep(200);
  }

  throw new Error(`Timeout waiting for design ${id} to process`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');

  log('\n╔════════════════════════════════════════════╗', colors.cyan);
  log('║        SVG Processor - Seed Script         ║', colors.cyan);
  log('╚════════════════════════════════════════════╝', colors.cyan);

  // Check if server is running
  log('\n🔍 Checking server connection...', colors.dim);

  const serverReady = await checkServer();
  if (!serverReady) {
    log('\n❌ Server is not running!', colors.red);
    log('   Please start the backend server first:', colors.dim);
    log('   pnpm dev:backend', colors.yellow);
    process.exit(1);
  }

  log('   ✓ Server is running', colors.green);

  // Clear existing designs if requested
  if (shouldClear) {
    await clearDesigns();
  }

  // Find SVG files in examples directory
  const svgFiles = fs
    .readdirSync(EXAMPLES_DIR)
    .filter((file) => file.endsWith('.svg'))
    .map((file) => path.join(EXAMPLES_DIR, file));

  if (svgFiles.length === 0) {
    log('\n⚠️  No SVG files found in examples/ directory', colors.yellow);
    process.exit(0);
  }

  log(`\n📁 Found ${svgFiles.length} SVG files to upload`, colors.bright);

  // Upload and process each file
  const results: { file: string; status: string; issues: string[] }[] = [];

  for (const filePath of svgFiles) {
    const fileName = path.basename(filePath);
    log(`\n📤 Uploading: ${fileName}`, colors.cyan);

    try {
      const uploadResult = await uploadFile(filePath);
      log(`   ⏳ Processing...`, colors.dim);

      const design = await waitForProcessing(uploadResult.id);

      results.push({
        file: fileName,
        status: design.status,
        issues: design.issues,
      });

      if (design.status === 'completed') {
        const issueText =
          design.issues.length > 0
            ? ` (issues: ${design.issues.join(', ')})`
            : '';
        log(
          `   ✓ Completed: ${design.itemsCount} rectangles${issueText}`,
          colors.green
        );
      } else {
        log(`   ✗ Error processing file`, colors.red);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`   ✗ Failed: ${message}`, colors.red);
      results.push({
        file: fileName,
        status: 'error',
        issues: [message],
      });
    }
  }

  // Summary
  log('\n' + '═'.repeat(50), colors.dim);
  log('\n📊 Summary:', colors.bright);

  const successful = results.filter((r) => r.status === 'completed').length;
  const failed = results.filter((r) => r.status === 'error').length;

  log(`   ✓ Successful: ${successful}`, colors.green);
  if (failed > 0) {
    log(`   ✗ Failed: ${failed}`, colors.red);
  }

  log(`\n🌐 View designs at: http://localhost:5173/designs`, colors.cyan);
  log('');
}

main().catch((error) => {
  log(
    `\n❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    colors.red
  );
  process.exit(1);
});
