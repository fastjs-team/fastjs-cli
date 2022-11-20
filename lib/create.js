const fs = require('fs-extra');
const path = require('path');
const _path = path
const inquirer = require('inquirer');
const output = require('./console/output');
const outputDev = require('./console/outputDev');

let runPath

async function create(name, options) {
  // output name
  await output(`Creating project *blue*${name}*blue*...`);
  // get command path
  runPath = process.cwd()
  // check option -p --path <path>
  if (options.path) {
    await outputDev("Option -p --path <path> found");
  }
  // ask for exact path
  const createPath = await askForPath(path.join(runPath, name));
  await outputDev(`createPath: ${createPath}`);
  // check if path exists
  if (fs.existsSync(createPath)) {
    await outputDev("Path exists");
    if (options.force) {
      await outputDev("Option -f --force found");
      await outputDev("Force overwrite");
      await outputDev(`Remove path ${createPath}`);
      fs.removeSync(createPath);
    } else {
      await outputDev("Option -f --force not found");
      await outputDev("Ask for overwrite");
      const {overwrite} = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: 'Target directory exists. Continue? (No)',
        default: false
      }]);
      if (!overwrite) {
        await outputDev("User choose not to overwrite");
        await outputDev("Program exit by user")
        return;
      }
      await outputDev("User choose to overwrite");
      await outputDev(`Remove path ${createPath}`);
      fs.removeSync(createPath);
    }
  }
}

async function askForPath(path) {
  // ask ok or not
  const {confirm} = await inquirer.prompt([
    {
      name: 'confirm',
      type: 'confirm',
      message: `Create project in ${path}? (Yes)`,
      default: true,
    }
  ])
  if (!confirm) {
    // not ok
    await outputDev("User cancel, retry");
    // ask for new path
    await inquirer.prompt([
      {
        name: 'path',
        type: 'input',
        message: 'Please input a new path:',
        validate: function (input) {
          return /^[a-zA-Z0-9-_\/.]+$/.test(input) && !/\.\./.test(input) ? true : "Please input a valid path.";
        }
      }
    ]).then(answer => {
      // new path entered
      output("")
      path = _path.join(runPath, answer.path)
      path = askForPath(path);
    })
    return path;
  }
  await outputDev("User confirm, continue");
  return path;
}

module.exports = create;