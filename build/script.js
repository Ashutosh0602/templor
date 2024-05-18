const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const Redis = require("ioredis");

const publisher = new Redis(process.env.REDIS);

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.ID,
    secretAccessKey: process.env.SECRET,
  },
});

function publishLog(log) {
  publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }));
}

const PROJECT_ID = process.env.PROJECT_ID;
async function init() {
  console.log("Executing script.js");
  publishLog("Build Started...");

  const outDirPath = path.join(__dirname, "output");

  const p = exec(` cd ${outDirPath} && npm install && npm run build`);

  p.stdout.on("data", (data) => {
    console.log(data.toString());
    publishLog(data.toString());
  });

  p.stdout.on("error", (data) => {
    console.log("Error ", data.toString());
    publishLog(`error: ${data.toString()}`);
  });

  p.on("close", async () => {
    console.log("Build complete");
    publishLog(`Build Complete`);

    const distFolderPath = path.join(__dirname, "output", "build");
    const distFolderContents = fs.readdirSync(distFolderPath, {
      recursive: true,
    });

    publishLog(`Starting to upload`);

    for (const file of distFolderContents) {
      const filePath = path.join(distFolderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log("Uploading... ", filePath);
      publishLog(`uploading ${file}`);

      const command = new PutObjectCommand({
        Bucket: "web-template-project",
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });

      await s3Client.send(command);

      publishLog(`uploaded ${file}`);
      console.log("Uploaded... ", filePath);
    }

    publishLog(`Done`);
    console.log("Done...");
  });
}

init();
