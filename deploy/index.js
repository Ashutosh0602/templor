const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const { createSpinner } = require("nanospinner");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.ID,
    secretAccessKey: process.env.SECRET,
  },
});

// Get the current working directory
const currentDirectory = process.cwd();

try {
  console.log("Running build command...");
  execSync("npm run build", { stdio: "inherit" });
  console.log("Build completed successfully.");

  // Start reading from the current directory
  const buildDir = path.join(currentDirectory, "build");
  readDirectoryRecursiveSync(buildDir);
} catch (error) {
  console.error("Error running build command:", error);
  process.exit(1); // Exit the script if the build fails
}

function readDirectoryRecursiveSync(directory) {
  // Read the contents of the directory
  const files = fs.readdirSync(directory, { recursive: true });

  const spinner = createSpinner("Uploading files...").start();

  let fileCount = 0;
  let uploadedCount = 0;

  // Filter files and log them
  files.forEach(async (file) => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      fileCount++;
      const command = new PutObjectCommand({
        Bucket: "web-template-project",
        Key: `__outputs/trial/${file}`,
        // Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });

      try {
        await s3Client.send(command);
        uploadedCount++;
        spinner.update({
          text: `Uploaded ${uploadedCount}/${fileCount} files`,
        });
      } catch (error) {
        console.error("Error uploading file:", filePath, error);
      }

      if (uploadedCount === fileCount) {
        spinner.success({ text: "All files uploaded successfully!" });
        console.log("http://trial.localhost:8000");
      }
    }
  });
}
