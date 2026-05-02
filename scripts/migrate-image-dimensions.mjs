/**
 * Migration script to bake image dimensions into MDX frontmatter.
 *
 * Handles both fresh files and already-migrated files (updates dimensions).
 *
 * Uses sharp (Node.js only) to fetch and measure each image.
 * Run with: node scripts/migrate-image-dimensions.mjs
 */

import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const ACCOUNT_HASH = "tfgleCjJafHVtd2F4ngDnQ";
const VARIANT = "large";

const dimensionCache = new Map();

async function getImageDimensions(cloudflareId) {
  if (dimensionCache.has(cloudflareId)) {
    return dimensionCache.get(cloudflareId);
  }

  const imageUrl = `https://imagedelivery.net/${ACCOUNT_HASH}/${cloudflareId}/${VARIANT}`;

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${cloudflareId}: ${response.status} ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const metadata = await sharp(buffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`No dimensions for ${cloudflareId}`);
  }

  const dims = { width: metadata.width, height: metadata.height };
  dimensionCache.set(cloudflareId, dims);
  return dims;
}

async function findMdxFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findMdxFiles(full)));
    } else if (entry.name.endsWith(".mdx")) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Handle a scalar field like "photo" or "coverImage".
 * Works for both unmigrated ("photo: <id>") and already-migrated (object with id/width/height).
 */
async function handleScalarField(content, fieldName) {
  // Already migrated: object form with id/width/height
  const migratedRegex = new RegExp(
    `^(${fieldName}):\\n  id: (.+)\\n  width: \\d+\\n  height: \\d+`,
    "m",
  );
  const migratedMatch = content.match(migratedRegex);
  if (migratedMatch) {
    const id = migratedMatch[2].trim();
    const dims = await getImageDimensions(id);
    return content.replace(
      migratedMatch[0],
      `${fieldName}:\n  id: ${id}\n  width: ${dims.width}\n  height: ${dims.height}`,
    );
  }

  // Unmigrated: bare string value
  const bareRegex = new RegExp(`^(${fieldName}): (.+)$`, "m");
  const bareMatch = content.match(bareRegex);
  if (!bareMatch) return content;

  const id = bareMatch[2].trim();
  const dims = await getImageDimensions(id);
  return content.replace(
    bareMatch[0],
    `${fieldName}:\n  id: ${id}\n  width: ${dims.width}\n  height: ${dims.height}`,
  );
}

/**
 * Handle the photos array. Works for both bare strings and already-migrated objects.
 */
async function handlePhotosArray(content) {
  // Already migrated: objects with id/width/height
  const migratedRegex =
    /^photos:\n((?:  - id: .+\n    width: \d+\n    height: \d+\n?)+)/m;
  const migratedMatch = content.match(migratedRegex);
  if (migratedMatch) {
    const ids = [...migratedMatch[1].matchAll(/  - id: (.+)/g)].map((m) =>
      m[1].trim(),
    );
    const entries = [];
    for (const id of ids) {
      const dims = await getImageDimensions(id);
      entries.push(
        `  - id: ${id}\n    width: ${dims.width}\n    height: ${dims.height}`,
      );
    }
    return content.replace(
      migratedMatch[0],
      `photos:\n${entries.join("\n")}\n`,
    );
  }

  // Unmigrated: bare string entries
  const bareRegex = /^photos:\n((?:  - (?!id:).+\n?)+)/m;
  const bareMatch = content.match(bareRegex);
  if (!bareMatch) return content;

  const ids = [...bareMatch[1].matchAll(/  - (.+)/g)].map((m) => m[1].trim());
  if (ids.length === 0) return content;

  const entries = [];
  for (const id of ids) {
    const dims = await getImageDimensions(id);
    entries.push(
      `  - id: ${id}\n    width: ${dims.width}\n    height: ${dims.height}`,
    );
  }

  return content.replace(bareMatch[0], `photos:\n${entries.join("\n")}\n`);
}

async function migrateFile(filePath) {
  let content = await fs.readFile(filePath, "utf-8");
  const original = content;

  content = await handleScalarField(content, "photo");
  content = await handleScalarField(content, "coverImage");
  content = await handlePhotosArray(content);

  if (content !== original) {
    await fs.writeFile(filePath, content, "utf-8");
    return true;
  }

  return false;
}

async function main() {
  const srcDir = path.resolve(process.cwd(), "src");

  const dirs = ["stream", "photos"].map((d) => path.join(srcDir, d));
  const allFiles = [];

  for (const dir of dirs) {
    try {
      allFiles.push(...(await findMdxFiles(dir)));
    } catch {
      // dir may not exist
    }
  }

  console.log(`Found ${allFiles.length} MDX files to scan\n`);

  let migrated = 0;
  let errors = 0;

  for (const file of allFiles) {
    try {
      const changed = await migrateFile(file);
      if (changed) {
        migrated++;
        console.log(`  ✓ ${path.relative(process.cwd(), file)}`);
      }
    } catch (err) {
      console.error(
        `  ✗ ${path.relative(process.cwd(), file)}: ${err.message}`,
      );
      errors++;
    }
  }

  console.log(`\nDone: ${migrated} files migrated, ${errors} errors`);
  console.log(`Image cache: ${dimensionCache.size} unique images resolved`);
}

main();
