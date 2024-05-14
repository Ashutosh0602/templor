import inquirer from "inquirer";
import gradient from "gradient-string";
import figlet from "figlet";
import frontend from "./frontend.js";
import backend from "./backend.js";
import fullStack from "./full-stack.js";

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
        console.log("Prompt couldn't be rendered in the current environment");
      } else {
        console.log("Something went wrong:", error);
      }
    });
}
