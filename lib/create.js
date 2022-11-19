const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const output = require('./console/output');
const outputDev = require('./console/outputDev');

async function create(name, options) {
  // output name
  await output(`Creating project *blue*${name}*blue*...`);
  // get command path
  const cwd = process.cwd();
  // check option -p --path <path>
  let runPath = path.join(cwd, name) || path.join(cwd, name);
  // ask for exact path
  const createPath = askForPath(runPath);
}

async function askForPath(path) {
  // ask ok or not
  await inquirer.prompt([
    {
      name: 'ok',
      type: 'confirm',
      message: `Create project in ${path}? (Yes)`,
      default: true
    }
  ]).catch(() => {
    // not ok
    outputDev("User cancel, retry");
    // ask for new path
    inquirer.prompt([
      {
        name: 'path',
        type: 'input',
        message: 'Please input a new path:',
        validate: function (input) {
          return verifyPath(input) ? input : true;
        }
      }
    ])
  })
  return path;
}

async function verifyPath(path) {
  const verify = !/^[a-zA-Z-_\/.]/.test(path);
  await outputDev("Path verify " + verify ? "success" : "failed");
  return verify;
}

module.exports = create;