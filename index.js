import inquirer from "inquirer";
import gradient from "gradient-string";
import figlet from "figlet";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { createSpinner } from "nanospinner";

// Display the "Templor!" banner
figlet.text(
  "Templor!",
  {
    font: "3D Diagonal",
    horizontalLayout: "default",
    verticalLayout: "default",
    width: 100,
    whitespaceBreak: true,
  },
  function (err, data) {
    if (err) {
      console.log("Something went wrong...");
      console.dir(err);
      return;
    }
    console.log(gradient("cyan", "pink")(data));
    startPrompt();
  }
);

function startPrompt() {
  // Ask the initial question about the project type
  inquirer
    .prompt([
      {
        type: "list",
        name: "projectType",
        message: "What kind of project will you be creating?",
        choices: ["Frontend", "Backend", "Full-Stack"],
      },
    ])
    .then((answers) => {
      switch (answers.projectType) {
        case "Frontend":
          frontend();
          break;
        case "Backend":
          backend();
          break;
        case "Full-Stack":
          fullStack();
          break;
        default:
          console.log("Invalid choice");
      }
    })
    .catch((error) => {
      if (error.isTtyError) {
        // Prompt couldn't be rendered in the current environment
        console.log("Prompt couldn't be rendered in the current environment");
      } else {
        // Something else went wrong
        console.log("Something went wrong:", error);
      }
    });
}

function frontend() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "language",
        message: "Do you want to use TypeScript or JavaScript?",
        choices: ["TypeScript", "JavaScript"],
      },
      {
        type: "list",
        name: "style",
        message: "Do you want to use CSS or SCSS?",
        choices: ["CSS", "SCSS"],
      },
      {
        type: "confirm",
        name: "tailwind",
        message: "Do you want to use TailwindCSS?",
        default: false,
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
      const { language, style, tailwind, projectName } = answers;
      const template = language === "TypeScript" ? "--template typescript" : "";

      console.log(
        `Creating ${language} project with ${style} and TailwindCSS: ${
          tailwind ? "Yes" : "No"
        }`
      );

      const spinner = createSpinner("Creating React app...").start();

      // Create React app with or without TypeScript
      exec(
        `npx create-react-app ${projectName} ${template}`,
        (err, stdout, stderr) => {
          if (err) {
            spinner.error({ text: `Error creating React app: ${stderr}` });
            return;
          }
          spinner.success({
            text: `React app created successfully in ${projectName}`,
          });

          // Navigate to the project directory
          process.chdir(projectName);

          // Create components and utils folders
          createFolders(["src/components", "src/utils"], spinner, () => {
            // Track completion of tasks
            let tasksCompleted = 0;
            const totalTasks = (style === "SCSS" ? 1 : 0) + (tailwind ? 1 : 0);

            // Modify the project based on user choices
            if (style === "SCSS") {
              setupSCSS(spinner, () => {
                tasksCompleted++;
                if (tasksCompleted === totalTasks) {
                  setupComplete(projectName);
                }
              });
            }

            if (tailwind) {
              setupTailwind(spinner, () => {
                tasksCompleted++;
                if (tasksCompleted === totalTasks) {
                  setupComplete(projectName);
                }
              });
            }

            // If no additional setups, complete immediately
            if (totalTasks === 0) {
              setupComplete(projectName);
            }
          });
        }
      );
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

function setupComplete(projectName) {
  console.log(`✔ Setup complete. Inside that directory, you can run several commands:

  cd ${projectName}
  npm start
    Starts the development server.
  npm run build
    Bundles the app into static files for production.
  npm test
    Starts the test runner.
  npm run eject
    Removes this tool and copies build dependencies, configuration files
    and scripts into the app directory. If you do this, you can’t go back!
  We suggest that you begin by typing:
    cd ${projectName}
    npm start
  `);
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

function backend() {
  console.log("You selected Backend project.");
  // Add more logic for backend project setup here
}

function fullStack() {
  console.log("You selected Full-Stack project.");
  // Add more logic for full-stack project setup here
}
