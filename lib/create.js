const fs = require('fs-extra');
const path = require('path');
const _path = path
const inquirer = require('inquirer');
const output = require('./console/output');
const outputDev = require('./console/outputDev');

// get command path
const runPath = process.cwd()

async function create(name, options) {
  // output name
  await output(`Creating project *blue*${name}*blue*...`);
  // check project name
  if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
    await outputDev("Project name invalid, exit");
    await output("Please input a valid name.", "red");
    return;
  }
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
  // check create path is exists
  if (fs.existsSync(createPath)) {
    await outputDev("Path still exists");
    await outputDev("Program exit by error");
    await output(`${createPath} remove failed, it may be occupied by other programs.`, "red");
    return;
  }
  // ask for project type
  const projectType = await askForType();
  let projectTypeSuper
  switch (projectType) {
    case 'vanilla':
      projectTypeSuper = "fastjs"
      break
    case 'vanilla-ts':
      projectTypeSuper = "fastjs-ts"
      break
    case 'vue':
      projectTypeSuper = "vue"
      break
    case 'vue-ts':
      projectTypeSuper = "vue-ts"
  }
  // start create
  await outputDev("Start create project");
  await outputDev(`Project type: ${projectType}`);
  await outputDev(`Project type super: ${projectTypeSuper}`);
  const load = require("io-spin");
  const spinner = load("Creating project");
  // start time
  const startTime = new Date().getTime();
  spinner.start();
  // check fastjs_cli_create is exists
  if (fs.existsSync(path.join(runPath, "fastjs_cli_create"))) {
    await outputDev("fastjs_cli_create exists");
    await outputDev("Remove fastjs_cli_create");
    fs.removeSync(path.join(runPath, "fastjs_cli_create"));
  }
  // do create command
  const {exec} = require('child_process');
  spinner.update("Install template");
  exec(`npm create vite@latest fastjs_cli_create -- --template ${projectType}`, {cwd: runPath}, error => {
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
      // edit package.json && package-lock.json name
      spinner.update("Update package");
      outputDev("Update package");
      const packageJson = require(path.join(createPath, "package.json"));
      const packageLockJson = require(path.join(createPath, "package-lock.json"));
      packageJson.name = name;
      packageLockJson.name = name;
      fs.writeFileSync(path.join(createPath, "package.json"), JSON.stringify(packageJson, null, 2));
      fs.writeFileSync(path.join(createPath, "package-lock.json"), JSON.stringify(packageLockJson, null, 2));
      // download resources from cdn
      spinner.update("Download resources");
      outputDev("Download resources");
      // download to createPath
      const download = require('download');
      download({extract: true, strip: 1})
        .get(`https://cdn.fastjs.com.cn/fastjs-cli/template/${projectTypeSuper}.zip`)
        .dest(createPath)
        .run((error) => {
          // check error
          if (error) {
            // check is 404
            if (error.statusCode !== 404) {
              spinner.stop();
              outputDev(error);
              outputDev("Program exit by error");
              output("Download resources failed, retry after a while.", "red");
              return
            }
            spinner.stop();
            outputDev("Download resources failed, 404");
            output("Template not found, continue with vite template.", "yellow");
          } else {
            outputDev("Download resources success in " + createPath);
            // read createPath/cli-config.json
            const cliConfig = require(path.join(createPath, "cli-config.json"));
            const deleteList = cliConfig.rm;
            // delete files
            spinner.update("Deleting files");
            outputDev("Deleting files");
            deleteList.forEach((item) => {
              fs.removeSync(path.join(createPath, item));
            })
            // delete cli-config.json
            fs.removeSync(path.join(createPath, "cli-config.json"));
            spinner.stop();
          }
          outputDev("Program create success in " + createPath);
          output(`Project *blue*${name}*blue* created in *blue*${createPath}*blue*`);
          output("")
          output(`Project create success in ${Math.floor((new Date().getTime() - startTime) / 1000)}s`);
          output("")
          output("To get started:", "green");
          output("- npm run dev", "green");
        })
      // continue by download callback
    })
    // continue by installation callback
  })
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
        'Vue-ts',
        'jQuery'
      ]
    }
  ])
  if (type === "jQuery") {
    await output("WTF, jQuery? Bro, I can't believe you use that, bye.", "red");
    // exit by error
    process.exit(1);
  }
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