const fs = require('fs-extra');
const path = require('path');
const _path = path
const inquirer = require('inquirer');
const output = require('./console/output');
const outputDev = require('./console/outputDev');
const load = require("io-spin");
const config = require('./config.json');

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
  const projectTypeSuper = config.project.find((item) => {
    return item.name === projectType
  }).parent;
  await outputDev(`Project type: ${projectTypeSuper}`);
  // ask for modules
  const modules = await askForModules();
  // find modules
  const moduleList = [];
  modules.forEach((module) => {
    const moduleConfig = require(path.join(__dirname,  "config.json")).modules.find((item) => item.name === module);
    moduleList.push(require(path.join(__dirname, "../modules", moduleConfig.path, "cli-config.json")));
  })
  // check modules parent
  modules.forEach((item) => {
    outputDev(`Module: ${item}`);
    const itemSuper = config.modules.find((item2) => {
      return item2.name === item
    })
    // if projectType is not in item.parent: Array<String>
    if (!itemSuper.parent.includes(projectTypeSuper) && !itemSuper.parent.length) {
      outputDev("Module parent not match project type");
      outputDev("Program exit by error");
      output(`Module *blue*${item}*blue* *red*is not support for project type*red* *blue*${projectType}*blue*`, "red");
      output(`Use *blue*${itemSuper.parent.toString()}*blue* *red*to create a project*red*`, "red");
      process.exit(1);
    }
  })
  const {installAfterSetup} = await inquirer.prompt([{
    type: 'confirm',
    name: 'installAfterSetup',
    message: 'Install dependencies after create? (Yes)',
    default: true
  }]);
  // start create
  await outputDev("Start create project");
  await outputDev(`Project type: ${projectType}`);
  await outputDev(`Project type super: ${projectTypeSuper}`);
  // close spin if dev
  await outputDev("Spinners are disabled in dev mode");
  const spinner = fs.pathExistsSync(path.join(process.cwd(), "ondev.key")) ? {
    start: () => 0,
    stop: () => 0,
    update: () => 0
  } : load("Creating project");
  // start time
  const startTime = new Date().getTime();
  spinner.start();
  // check fastjs_cli_create is exists
  if (fs.existsSync(path.join(runPath, "fastjs_cli_create"))) {
    await outputDev("fastjs_cli_create exists");
    await outputDev("Remove fastjs_cli_create");
    fs.removeSync(path.join(runPath, "fastjs_cli_create"));
  }
  // check npm version to number
  const npmVersion = require("child_process").execSync("npm -v").toString()
  const npmVersionNum = Number(npmVersion.split(".")[0])
  await outputDev(`npm version: ${npmVersionNum}`);
  // if npm version >= 7
  const EXTRA_ARGS = npmVersionNum >= 7 ? "-- " : "";
  await outputDev(`EXTRA_ARGS: ${EXTRA_ARGS}`);
  // do create command
  const {exec} = require('child_process');
  spinner.update("Install template");
  await outputDev("Install template");
  exec(`npm create vite@latest fastjs_cli_create ${EXTRA_ARGS}--template ${projectTypeSuper}`, {cwd: runPath}, error => {
    if (error) {
      spinner.stop();
      outputDev(error);
      outputDev("Program exit by error");
      return
    }
    spinner.update("Moving template");
    outputDev("move to new path");
    // ./fastjs_cli_create -> createPath
    // noinspection JSCheckFunctionSignatures
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
      // install dependencies
      if (installAfterSetup) {
        spinner.update("Install dependencies");
        outputDev("Install dependencies");
        exec(`npm install`, {cwd: createPath}, (error) => {
          if (error) {
            spinner.stop();
            outputDev("Error: npm install");
            outputDev("Program exit by error");
            output("There was an error when creating the project, open dev mode to see more info")
            return
          }
          outputDev("Install dependencies success");
          nextToUpdatePackage();
        })
        return;
      }
      nextToUpdatePackage()

      function nextToUpdatePackage() {
        // edit package.json && package-lock.json name
        spinner.update("Update package");
        outputDev("Update package");
        const packageJson = require(path.join(createPath, "package.json"));
        // check package-lock.json
        if (fs.existsSync(path.join(createPath, "package-lock.json"))) {
          const packageLockJson = require(path.join(createPath, "package-lock.json"));
          packageLockJson.name = name;
          fs.writeFileSync(path.join(createPath, "package-lock.json"), JSON.stringify(packageLockJson, null, 2));
        }
        packageJson.name = name;
        packageJson.scripts = {
          dev: "fastjs dev",
          build: "fastjs build",
        }
        fs.writeFileSync(path.join(createPath, "package.json"), JSON.stringify(packageJson, null, 2));
        // copy template
        spinner.update("Copy resources");
        outputDev("Copy resources");
        // copy ./template/projectTypeSuper to createPath
        // noinspection JSCheckFunctionSignatures
        fs.copySync(path.join(__dirname, "..", "template", projectTypeSuper), createPath);
        outputDev("Copy resources success in " + createPath);
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
        fs.removeSync(path.join(createPath, "cli-config.json"))
        // check vite.config.js
        spinner.update("Config setup");
        outputDev("Config setup");
        if (!fs.existsSync(path.join(createPath, "vite.config.js"))) {
          outputDev("Create vite.config.js");
          fs.createFileSync(path.join(createPath, "vite.config.js"))
          fs.writeFileSync(path.join(createPath, "vite.config.js"), `export default {}`)
        }
        // update vite.config.js
        outputDev("Update vite.config.js");
        const viteConfig = fs.existsSync(path.join(createPath, "vite.config.js")) ? {plugins: []} : {};
        const viteImport = [];
        viteConfig.base = `./`;
        viteConfig.build = {
          outDir: `./fastjs_build_temp/`
        };
        viteConfig.plugins = []
        // if vue
        cliConfig.plugins.forEach((plugin) => {
          outputDev(`Add ${projectType} plugin: ${plugin.name}`);
          plugin.depends.forEach((depend) => {
            outputDev(`Add ${plugin.name} plugin depend: ${depend}`);
            viteImport.push(depend);
          })
          plugin.commands.forEach((command) => {
            outputDev(`Add ${plugin.name} plugin command: ${command}`);
            viteConfig.plugins.push(command);
          })
        })
        // install modules
        modules.forEach((module) => {
          spinner.update(`Install module ${module}`);
          outputDev(`Install module ${module}`);
          // check ./config.json and find module
          const moduleConfig = require(path.join(__dirname, "config.json")).modules.find((item) => item.name === module);
          // check {moduleConfig.path}/cli-config.json
          const moduleCliConfig = require(path.join(moduleConfig.path, "cli-config.json"));
          // install module dependencies
          moduleCliConfig.depends.forEach((depend) => {
            spinner.update(`Install module ${module} depend: ${depend}`);
            const {execSync} = require('child_process');
            execSync(`npm install ${depend}`, {cwd: createPath});
          })
          spinner.update(`Install module ${module} setup`);
          // mkdir
          moduleCliConfig.mkdir.forEach((dir) => {
            // mkdir -> dir
            outputDev(`Install module ${module} setup: mkdir ${dir}`);
            fs.mkdirSync(path.join(createPath, dir));
          })
          // copy files
          moduleCliConfig.files.forEach((file) => {
            // {
            //   from: <dir>
            //   to: <dir>
            // }
            // copy from -> to

            outputDev(`Install module ${module} setup: copy ${file.from} to ${file.to}`);
            // noinspection JSCheckFunctionSignatures
            fs.copySync(path.join(__dirname, moduleConfig.path, file.from), path.join(createPath, file.to));
          })
          // rm files
          moduleCliConfig.rm.forEach((file) => {
            outputDev(`Install module ${module} setup: rm ${file}`);
            fs.removeSync(path.join(createPath, file));
          })
        })
        // if vue project
        if (projectType.indexOf("Vue") !== -1) {
          // rewrite src/main.js
          // vue use
          let useList = ""
          moduleList.forEach((module) => {
            outputDev(`Add ${module.name} module use`);
            // module.main.use each
            module.main.use.forEach((use) => {
              outputDev(`Add ${module.name} module use: ${use}`);
              useList += `.use(${use})`
            })
          })
          // vue import
          let importList = ""
          moduleList.forEach((module) => {
            outputDev(`Add ${module.name} module import`);
            // module.main.file each
            module.main.file.forEach((file) => {
              outputDev(`Add ${module.name} module import: ${file}`);
              importList += file + "\n";
            })
          })
          outputDev(`importList:\n${importList}`);
          outputDev(`useList: ${useList}`);
          const mainJs =
            `import {createApp} from 'vue'
import App from './App.vue'
import './style.css'
${importList}
const app = createApp(App)

app${useList}.mount('#app')`
          // write main.js || main.ts
          const writePath = projectTypeSuper === "vue" ? path.join(createPath, "src", "main.js") : path.join(createPath, "src", "main.ts");
          fs.writeFileSync(writePath, mainJs);
        }
        // write vite.config.js
        outputDev("Write vite.config.js");
        let writeString = ""
        viteImport.forEach((item) => {
          writeString += item + "\n"
        })
        writeString += "\n" + "export default " + JSON.stringify(viteConfig, null, 2)
        viteConfig.plugins.forEach((item) => {
          writeString = writeString.replace(`"${item}"`, item)
        })
        fs.writeFileSync(path.join(createPath, "vite.config.js"), writeString);
        spinner.stop();
        outputDev("Program create success in " + createPath);
        output(`Project *blue*${name}*blue* created in *blue*${createPath}*blue*`);
        output("")
        output(`Project create success in ${Math.floor((new Date().getTime() - startTime) / 1000)}s`);
        output("")
        output("To get started:", "green");
        output("- npm run dev", "green");
        output("");
      }
    })
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
    // noinspection JSUnusedGlobalSymbols
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
      choices: config.project.map((item) => {
        return item.name
      })
    }
  ])
  if (type === "jQuery") {
    await output("WTF, jQuery? Bro, I can't believe you use that, bye.", "red");
    // exit by error
    process.exit(1);
  }
  await outputDev(`User choose project type: ${type}`);
  return type;
}

async function askForModules() {
  // ask for modules
  const {modules} = await inquirer.prompt([
    {
      name: 'modules',
      type: 'checkbox',
      message: 'Please select modules:',
      choices: config.modules.map((item) => {
        return item.name
      })
    }
  ])
  await outputDev(`User choose modules: ${modules}`);
  return modules;
}

module.exports = create;