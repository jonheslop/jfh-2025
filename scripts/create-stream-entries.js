/**
 * Creates stream MDX files from upload-images.js output.
 * Reads EXIF from batch-out/batch-in to determine day of year and camera.
 *
 * Usage: bun scripts/upload-images.js | bun scripts/create-stream-entries.js
 *    or: pbpaste | bun scripts/create-stream-entries.js
 */

const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

const batchOutDir = "./batch-out";
const batchInDir = "./batch-in";
const streamBaseDir = "./src/stream";

const input = await Bun.stdin.text();

// Parse photo entries from the YAML-ish output
const photos = [];
const lines = input.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === "photo:") {
    const entry = {};
    let j = i + 1;
    while (j < lines.length && lines[j].match(/^\s+\w+:/)) {
      const match = lines[j].trim().match(/^(\w+):\s*(.+)$/);
      if (match) entry[match[1]] = match[2];
      j++;
    }
    if (entry.id) {
      photos.push({
        id: entry.id,
        width: parseInt(entry.width),
        height: parseInt(entry.height),
      });
    }
  }
}

if (photos.length === 0) {
  console.log("No photo entries found in input.");
  console.log(
    "Usage: bun scripts/upload-images.js | bun scripts/create-stream-entries.js",
  );
  process.exit(1);
}

console.log(`Found ${photos.length} photo(s)\n`);

function formatCamera(raw) {
  if (raw.startsWith("LEICA")) return "Leica" + raw.slice(5);
  return raw;
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / (1000 * 60 * 60 * 24));
}

function getExif(filePath) {
  try {
    const output = execSync(
      `mdls -name kMDItemContentCreationDate -name kMDItemAcquisitionModel "${filePath}"`,
      { encoding: "utf8" },
    );

    const dateMatch = output.match(
      /kMDItemContentCreationDate\s*=\s*(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\s+([+-]\d{4})/,
    );
    const cameraMatch = output.match(/kMDItemAcquisitionModel\s*=\s*"(.+)"/);

    let date = null;
    if (dateMatch) {
      const [, y, mo, d, h, mi, s, tz] = dateMatch;
      const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}${tz.slice(0, 3)}:${tz.slice(3)}`;
      date = new Date(iso);
    }

    return {
      date,
      camera: cameraMatch ? formatCamera(cameraMatch[1]) : null,
    };
  } catch {
    return { date: null, camera: null };
  }
}

function findFile(photoId) {
  for (const dir of [batchOutDir, batchInDir]) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    const match = files.find((f) => f.split(".")[0] === photoId);
    if (match) return path.join(dir, match);
  }
  return null;
}

for (const photo of photos) {
  const filePath = findFile(photo.id);

  if (!filePath) {
    console.log(`✗ ${photo.id}: not found in batch-out or batch-in`);
    continue;
  }

  const { date, camera } = getExif(filePath);

  if (!date) {
    console.log(`✗ ${photo.id}: could not read creation date`);
    continue;
  }

  const year = date.getFullYear();
  const day = getDayOfYear(date);
  const mdxPath = path.join(streamBaseDir, String(year), `${day}.mdx`);

  if (fs.existsSync(mdxPath)) {
    console.log(`⚠ ${photo.id} → day ${day} already exists, skipping`);
    continue;
  }

  let content = "---\n";
  content += `photo:\n  id: ${photo.id}\n  width: ${photo.width}\n  height: ${photo.height}\n`;
  if (camera) content += `camera: ${camera}\n`;
  content += "---\n\n";

  fs.mkdirSync(path.dirname(mdxPath), { recursive: true });
  fs.writeFileSync(mdxPath, content);
  console.log(
    `✔ ${photo.id} → day ${day} (${mdxPath})${camera ? ` [${camera}]` : ""}`,
  );
}
