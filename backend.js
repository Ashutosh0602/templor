import inquirer from "inquirer";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { createSpinner } from "nanospinner";

function backend() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "language",
        message: "Do you want to use TypeScript or JavaScript?",
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
      const { language, projectName } = answers;
      const isTypeScript = language === "TypeScript";
      const projectDir = `./${projectName}`;

      console.log(`Creating ${language} Node.js project with Express.js`);

      const spinner = createSpinner("Setting up Node.js project...").start();

      // Create project directory
      fs.mkdirSync(projectDir);

      // Initialize Node.js project
      exec(`npm init -y`, { cwd: projectDir }, (err) => {
        if (err) {
          spinner.error({ text: `Error initializing Node.js project: ${err}` });
          return;
        }

        // Install Express.js and optionally TypeScript
        const devDependencies = isTypeScript
          ? "typescript @types/node @types/express ts-node"
          : "";
        const installCommand = `npm install express && npm install --save-dev ${devDependencies}`;

        exec(installCommand, { cwd: projectDir }, (err) => {
          if (err) {
            spinner.error({ text: `Error installing dependencies: ${err}` });
            return;
          }

          if (isTypeScript) {
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
              path.join(projectDir, "tsconfig.json"),
              JSON.stringify(tsconfig, null, 2)
            );
          }

          // Create basic server file
          const srcDir = path.join(projectDir, "src");
          fs.mkdirSync(srcDir);
          const serverFile = isTypeScript ? "src/server.ts" : "src/server.js";
          const serverContent = `
import express from 'express';
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(port, () => {
  console.log(\`Server is running on port \${port}\`);
});
`;
          fs.writeFileSync(path.join(projectDir, serverFile), serverContent);

          spinner.success({
            text: `Node.js project created successfully in ${projectName}`,
          });
          console.log(`✔ Setup complete. Inside that directory, you can run several commands:

  cd ${projectName}
  npm start
    Starts the development server.
  `);
        });
      });
    })
    .catch((error) => {
      if (error.isTtyError) {
        console.log("Prompt couldn't be rendered in the current environment");
      } else {
        console.log("Something went wrong:", error);
      }
    });
}

export default backend;
