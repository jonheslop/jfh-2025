const fs = require("fs");
const directoryPath = "./batch-out";
const { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } = process.env;

/**
 * Parse JPEG dimensions from file buffer by reading SOF markers.
 */
function getJpegDimensions(buffer) {
  let offset = 0;
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error("Not a JPEG file");
  }
  offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      throw new Error(`Expected marker at offset ${offset}`);
    }

    const marker = buffer[offset + 1];

    // SOF markers (0xC0-0xCF except 0xC4 and 0xCC)
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }

    // Skip to next marker
    const segmentLength = buffer.readUInt16BE(offset + 2);
    offset += 2 + segmentLength;
  }

  throw new Error("Could not find dimensions in JPEG");
}

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.error("Error reading directory:", err);
    return;
  }

  files.forEach(async (file) => {
    // Only want to upload jpegs
    if (/\.jpe?g$/i.test(file)) {
      const fileID = file.split(".")[0];
      const filePath = `${directoryPath}/${file}`;
      const formData = new FormData();
      formData.append("file", Bun.file(filePath));
      formData.append("id", fileID);

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          },
        },
      );

      const body = await response.json();

      if (body.success === true) {
        const buffer = Buffer.from(await Bun.file(filePath).arrayBuffer());
        const { width, height } = getJpegDimensions(buffer);
        console.log(`✔ ${file}`);
        console.log(`photo:`);
        console.log(`  id: ${fileID}`);
        console.log(`  width: ${width}`);
        console.log(`  height: ${height}`);
        console.log();
      } else {
        console.log("✗", file);
        console.log(body.errors);
      }
    }
  });
});
