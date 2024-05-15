import inquirer from "inquirer";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { createSpinner } from "nanospinner";

function fullStack() {
  console.log("You selected Full-Stack project.");

  inquirer
    .prompt([
      {
        type: "list",
        name: "frontendLanguage",
        message: "Do you want to use TypeScript or JavaScript for frontend?",
        choices: ["TypeScript", "JavaScript"],
      },
      {
        type: "list",
        name: "frontendStyle",
        message: "Do you want to use CSS or SCSS for frontend?",
        choices: ["CSS", "SCSS"],
      },
      {
        type: "confirm",
        name: "frontendTailwind",
        message: "Do you want to use TailwindCSS for frontend?",
        default: false,
      },
      {
        type: "list",
        name: "backendLanguage",
        message: "Do you want to use TypeScript or JavaScript for backend?",
        choices: ["TypeScript", "JavaScript"],
      },
      {
        type: "input",
        name: "projectName",
        message: "What is the name of your project?",
        validate: function (input) {
          if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
          else
            return "Project name may only include letters, numbers, underscores, and hashes.";
        },
      },
    ])
    .then((answers) => {
      const {
        frontendLanguage,
        frontendStyle,
        frontendTailwind,
        backendLanguage,
        projectName,
      } = answers;

      console.log(
        `Creating Full-Stack project with frontend ${frontendLanguage}, ${frontendStyle}, TailwindCSS: ${
          frontendTailwind ? "Yes" : "No"
        } and backend ${backendLanguage}`
      );

      const frontendTemplate =
        frontendLanguage === "TypeScript" ? "--template typescript" : "";
      const backendTemplate =
        backendLanguage === "TypeScript" ? "--typescript" : "";

      const frontendSpinner = createSpinner(
        "Creating React app for frontend..."
      ).start();

      // Create React app for frontend with or without TypeScript
      exec(`npx create-react-app frontend ${frontendTemplate}`, (err) => {
        if (err) {
          frontendSpinner.error({
            text: `Error creating React app for frontend: ${err}`,
          });
          return;
        }

        frontendSpinner.success({
          text: "React app for frontend created successfully",
        });

        // Move to frontend directory
        process.chdir("frontend");

        process.chdir("src");

        // Create api.js file with localhost link
        const apiContent = `export const API_URL = 'http://localhost:3000';`;
        fs.writeFileSync("api.js", apiContent);

        process.chdir("..");

        // Create components and utils folders for frontend
        createFolders(["src/components", "src/utils"], frontendSpinner, () => {
          let frontendTasksCompleted = 0;
          const frontendTotalTasks =
            (frontendStyle === "SCSS" ? 1 : 0) + (frontendTailwind ? 1 : 0);

          // Modify the frontend project based on user choices
          if (frontendStyle === "SCSS") {
            setupSCSS(frontendSpinner, () => {
              frontendTasksCompleted++;
              if (frontendTasksCompleted === frontendTotalTasks) {
                frontendSetupComplete();
              }
            });
          }

          if (frontendTailwind) {
            setupTailwind(frontendSpinner, () => {
              frontendTasksCompleted++;
              if (frontendTasksCompleted === frontendTotalTasks) {
                frontendSetupComplete();
              }
            });
          }

          if (frontendTotalTasks === 0) {
            frontendSetupComplete();
          }
        });
      });

      function frontendSetupComplete() {
        process.chdir("..");

        const backendSpinner = createSpinner(
          "Setting up Node.js project for backend..."
        ).start();

        fs.mkdirSync("backend");

        process.chdir("backend");

        // Initialize Node.js project for backend
        exec(`npm init -y`, (err) => {
          if (err) {
            backendSpinner.error({
              text: `Error initializing Node.js project for backend: ${err}`,
            });
            return;
          }

          const devDependencies =
            backendLanguage === "TypeScript"
              ? "typescript @types/node @types/express ts-node"
              : "";
          const installCommand = `npm install express && npm install --save-dev ${devDependencies}`;

          exec(installCommand, (err) => {
            if (err) {
              backendSpinner.error({
                text: `Error installing dependencies for backend: ${err}`,
              });
              return;
            }

            if (backendLanguage === "TypeScript") {
              // Create tsconfig.json for TypeScript
              const tsconfig = {
                compilerOptions: {
                  target: "ES6",
                  module: "commonjs",
                  outDir: "./dist",
                  rootDir: "./src",
                  strict: true,
                  esModuleInterop: true,
                  skipLibCheck: true,
                },
              };
              fs.writeFileSync(
                "tsconfig.json",
                JSON.stringify(tsconfig, null, 2)
              );
            }

            // Create basic server file for backend
            const srcDir = "src";
            fs.mkdirSync(srcDir);
            const serverFile =
              backendLanguage === "TypeScript"
                ? "src/server.ts"
                : "src/server.js";
            const serverContent = `
  cosnt express = require('express');
  const app = express();
  const port = process.env.PORT || 3000;
  
  app.get('/', (req, res) => {
    res.send('Hello, World!');
  });
  
  app.listen(port, () => {
    console.log(\`Server is running on port \${port}\`);
  });
  `;
            fs.writeFileSync(serverFile, serverContent);

            backendSpinner.success({
              text: `Node.js project for backend created successfully`,
            });
            console.log(`✔ Setup complete. Inside that directory, you can run several commands:
  
    cd backend
    npm start
      Starts the development server for backend.
    `);
          });
        });
      }
    })
    .catch((error) => {
      if (error.isTtyError) {
        console.log("Prompt couldn't be rendered in the current environment");
      } else {
        console.log("Something went wrong:", error);
      }
    });
}

function createFolders(folders, spinner, callback) {
  folders.forEach((folder) => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  });
  spinner.success({ text: "Created components and utils folders" });
  callback();
}

function setupSCSS(spinner, callback) {
  spinner.update({ text: "Setting up SCSS..." });
  exec("npm install sass", (err, stdout, stderr) => {
    if (err) {
      spinner.error({ text: `Error installing SCSS: ${stderr}` });
      return;
    }
    spinner.success({ text: "SCSS setup completed" });
    // Rename .css files to .scss
    renameFiles("src", ".css", ".scss");
    callback();
  });
}

function setupTailwind(spinner, callback) {
  spinner.update({ text: "Setting up TailwindCSS..." });
  exec(
    "npm install -D tailwindcss@latest postcss@latest autoprefixer@latest && npx tailwindcss init",
    (err, stdout, stderr) => {
      if (err) {
        spinner.error({ text: `Error installing TailwindCSS: ${stderr}` });
        return;
      }
      spinner.success({ text: "TailwindCSS setup completed" });

      // Add TailwindCSS configuration to postcss.config.js and src/index.css
      const tailwindConfig = `
    module.exports = {
      purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
      darkMode: false, // or 'media' or 'class'
      theme: {
        extend: {},
      },
      variants: {
        extend: {},
      },
      plugins: [],
    };
    `;
      fs.writeFileSync("tailwind.config.js", tailwindConfig);

      const postcssConfig = `
    module.exports = {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    };
    `;
      fs.writeFileSync("postcss.config.js", postcssConfig);

      const indexCSS = `
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
    `;
      fs.writeFileSync("src/index.css", indexCSS);

      callback();
    }
  );
}

function renameFiles(dir, oldExt, newExt) {
  fs.readdir(dir, (err, files) => {
    if (err) throw err;
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        renameFiles(filePath, oldExt, newExt);
      } else if (path.extname(file) === oldExt) {
        const newFilePath = path.join(
          dir,
          path.basename(file, oldExt) + newExt
        );
        fs.renameSync(filePath, newFilePath);
      }
    });
  });
}

export default fullStack;
