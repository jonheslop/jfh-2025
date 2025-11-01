const fs = require("fs");
const directoryPath = "./batch-out";
const { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } = process.env;

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.error("Error reading directory:", err);
    return;
  }

  files.forEach(async (file) => {
    // Only want to upload jpegs
    if (/\.jpe?g$/i.test(file)) {
      const fileID = file.split(".")[0];
      const formData = new FormData();
      formData.append("file", Bun.file(`${directoryPath}/${file}`));
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
      console.log(body.success === true ? "✔" : "✗", file);
      if (body.success === false) {
        console.log(body.errors);
      }
    }
  });
});
