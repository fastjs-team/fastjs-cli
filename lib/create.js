const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

async function create(name, options) {
  // output name
  console.log(`Creating project ${name}...`);
  // Ask project name
  if (!name) {
    name = await askProjectName();
  }
}

// project name
async function askProjectName() {
  // noinspection UnnecessaryLocalVariableJS
  const name = await inquirer.prompt([{
    type: "input",
    name: "name",
    message: "Enter project name:",
    validate: function (input) {
      // A-Z, a-z, 0-9, -, _
      if (/^[a-zA-Z0-9_-]+$/.test(input)) {
        return true;
      }
      return "Project name can only contain letters, numbers, underscores and dashes.";
    }
  }])

  return name;
}

export default create;