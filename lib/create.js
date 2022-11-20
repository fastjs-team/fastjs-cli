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
      await output(`Removing path *blue*${createPath}*blue*...`);
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
      await output(`Removing path *blue*${createPath}*blue*...`);
      fs.removeSync(createPath);
    }
  }
  // ask for project type
  const projectType = await askForType();
  // start create
  await outputDev("Start create project");
  const load = require("io-spin");
  const spinner = load("Creating project");
  spinner.start();
  // do create command
  const {exec} = require('child_process');
  spinner.update("Install template");
  exec(`npm create vite@latest fastjs_cli_create -- --template ${projectType} --force`, {cwd: runPath}, error => {
      if (error) {
        spinner.stop();
        outputDev(error);
        outputDev("Program exit by error");
        return
      }
      spinner.update("Moving template");
      outputDev("move to new path");
      // ./fastjs_cli_create -> createPath
      fs.moveSync(`${runPath}/fastjs_cli_create`, createPath);
      outputDev(`move ./fastjs_cli_create to ${createPath}`);
      spinner.update("Install fastjs");
      outputDev("Install fastjs");
      exec(`npm install fastjs-next`, {cwd: createPath}, (error) => {
        if (error) {
          spinner.stop();
          outputDev(error);
          outputDev("Program exit by error");
          return
        }
        spinner.stop();
        outputDev("Program create success in " + createPath);
        output(`Project *blue*${name}*blue* created in *blue*${createPath}*blue*`);
      })
    }
  )
  // end by child_process
  // continue by child_process callback
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

async function askForType() {
  // ask for project type
  let {type} = await inquirer.prompt([
    {
      name: 'type',
      type: 'list',
      message: 'Please select a project type:',
      choices: [
        'Fastjs',
        'Fastjs-ts',
        'Vue',
        'Vue-ts'
      ]
    }
  ])
  await outputDev(`User choose project type: ${type}`);
  switch (type) {
    case 'Fastjs':
      type = 'vanilla';
      break;
    case 'Fastjs-ts':
      type = 'vanilla-ts';
      break;
    case 'Vue':
      type = 'vue';
      break;
    case 'Vue-ts':
      type = 'vue-ts';
  }
  await outputDev(`Project type: ${type}`);
  return type;
}

module.exports = create;