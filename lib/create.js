const fs = require('fs-extra');
const path = require('path');
const _path = path
const inquirer = require('inquirer');
const output = require('./console/output');
const outputDev = require('./console/outputDev');
const load = require("ora");
const config = require('./config.json');
const {exec, execSync} = require('child_process');

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
    const moduleConfig = require(path.join(__dirname, "config.json")).modules.find((item) => item.name === module);
    moduleList.push(require(path.join(__dirname, "../modules", moduleConfig.path, "cli-config.json")));
  })
  // check modules parent
  modules.forEach((item) => {
    outputDev(`Module: ${item}`);
    const itemSuper = config.modules.find((item2) => {
      return item2.name === item
    })
    // if projectType is not in item.parent: Array<String>
    if (!itemSuper.parent.includes(projectType) && itemSuper.parent.length) {
      outputDev("Module parent not match project type");
      outputDev("Program exit by error");
      output(`Module *blue*${item}*blue* *red*is not support for project type*red* *blue*${projectType}*blue*`, "red");
      output(`Use *blue*${itemSuper.parent.toString()}*blue* *red*to create a project*red*`, "red");
      process.exit(1);
    }
  })
  // ask css
  const cssLoader = await askForCss();
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
  // start time
  const startTime = new Date().getTime();
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
  const spinner = fs.pathExistsSync(path.join(process.cwd(), "ondev.key")) ? {} :
    load("Creating project").start();
  await outputDev("Install template");
  exec(`npm create vite@latest fastjs_cli_create ${EXTRA_ARGS}--template ${projectTypeSuper}`, {
    cwd: runPath,
    stdio: 'ignore'
  }, error => {
    if (error) {
      spinner.stop();
      outputDev(error);
      outputDev("Program exit by error");
      return
    }
    spinner.text = "Moving template"
    outputDev("move to new path");
    // ./fastjs_cli_create -> createPath
    // noinspection JSCheckFunctionSignatures
    fs.moveSync(`${runPath}/fastjs_cli_create`, createPath);
    outputDev(`move ./fastjs_cli_create to ${createPath}`);
    spinner.text = "Install fastjs"
    outputDev("Install fastjs");
    exec(`npm install fastjs-next`, {cwd: createPath, stdio: 'ignore'}, (error) => {
      if (error) {
        spinner.stop();
        outputDev(error);
        outputDev("Program exit by error");
        return
      }
      // install dependencies
      if (installAfterSetup) {
        spinner.text = "Install dependencies"
        outputDev("Install dependencies");
        exec(`npm install --local`, {cwd: createPath, stdio: 'ignore'}, (error) => {
          if (error) {
            spinner.stop();
            outputDev("Error: npm install");
            outputDev("Program exit by error");
            output("There was an error when creating the project, open dev mode to see more info")
            return
          }
          outputDev("Install dependencies success");
          nextToUpdatePackage()
        })
        return;
      }
      nextToUpdatePackage()

      function nextToUpdatePackage() {

        // edit package.json && package-lock.json name
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
        outputDev("Copy resources");
        // copy ./template/projectTypeSuper to createPath
        // noinspection JSCheckFunctionSignatures
        fs.copySync(path.join(__dirname, "..", "template", projectType), createPath);
        outputDev("Copy resources success in " + createPath);
        // read createPath/cli-config.json
        const cliConfig = require(path.join(createPath, "cli-config.json"));
        const deleteList = cliConfig.rm;
        // delete files
        outputDev("Deleting files");
        deleteList.forEach((item) => {
          fs.removeSync(path.join(createPath, item));
        })
        // delete cli-config.json
        fs.removeSync(path.join(createPath, "cli-config.json"))
        // check vite.config.js
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
        // install css preprocessor
        if (cssLoader !== "css") {
          spinner.text = "Install css preprocessor"
          outputDev(`Install css preprocessor ${cssLoader} ${cssLoader}-loader`);
          exec(`npm install ${cssLoader} ${cssLoader}-loader --local`, {cwd: createPath, stdio: 'ignore'}, () =>{
            nextToPluginSetup()
          });
          return
        }
        nextToPluginSetup()

        function nextToPluginSetup() {
          spinner.stop()
          output("")
          output("Please have a wait, we are setting up the project", "blue");
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
            outputDev(`Install module ${module}`);
            // check ./config.json and find module
            const moduleConfig = require(path.join(__dirname, "config.json")).modules.find((item) => item.name === module);
            // check {moduleConfig.path}/cli-config.json
            const moduleCliConfig = require(path.join(moduleConfig.path, "cli-config.json"));
            // install module dependencies
            moduleCliConfig.depends.forEach((depend) => {
              // child process disallow output to console
              execSync(`npm install ${depend} --local`, {cwd: createPath, stdio: 'ignore'});
            })
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
          // read all files and replace <style> -> <style lang="${cssLoader}">
          const readDir = (dir) => {
            outputDev(`Read dir ${dir}`);
            const files = fs.readdirSync(path.join(createPath, dir));
            files.forEach((file) => {
              outputDev(`Read ${file}`);
              // if dir
              if (fs.statSync(path.join(createPath, dir, file)).isDirectory()) {
                readDir(path.join(dir + "/" + file));
                return
              }
              // if file
              // replace <style> -> <style lang="${cssLoader}">
              // get file content
              const fileContent = fs.readFileSync(path.join(createPath, dir, file), "utf-8");
              // replace
              const newFileContent = fileContent
                .replace(/<style>/g, `<style lang="${cssLoader}">`)
                .replace(/<style scoped>/g, `<style scoped lang="${cssLoader}">`)
                .replace(/\.css/g, `.${cssLoader}`);
              // if file === *.css
              if (file.endsWith(".css")) {
                // rename file
                fs.renameSync(path.join(createPath, dir, file), path.join(createPath, dir, file.replace(".css", `.${cssLoader}`)));
                file = file.replace(".css", `.${cssLoader}`);
              }
              // write file
              fs.writeFileSync(path.join(createPath, dir, file), newFileContent);
            })
          }
          if (cssLoader !== "css") {
            readDir("src");
            viteConfig.css = {}
            viteConfig.css.preprocessorOptions = {
              [cssLoader]: {
                javascriptEnabled: true
              }
            }
          }
          moduleList.forEach((module) => {
            const moduleConfig = module?.special?.viteConfig;
            if (moduleConfig) {
              moduleConfig.depends.forEach((depend) => {
                outputDev(`Add ${module.name} module depend: ${depend}`);
                viteImport.push(depend);
              })
              moduleConfig.commands.forEach((command) => {
                outputDev(`Add ${module.name} module command: ${command}`);
                viteConfig.plugins.push(command);
              })
            }
          })
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
          output("")
          outputDev("Program create success in " + createPath);
          output(`Project *blue*${name}*blue* created in *blue*${createPath}*blue*`);
          output("")
          output(`Project create success in ${Math.floor((new Date().getTime() - startTime) / 1000)}s`);
          output("")
          output("To get started:", "green");
          output("- npm run dev", "green");
          output("");
        }
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

async function askForCss() {
  // ask for css
  const {css} = await inquirer.prompt([
    {
      name: 'css',
      type: 'list',
      message: 'Please select a css preprocessor:',
      choices: ["css", "sass", "less", "stylus"]
    }
  ])
  await outputDev(`User choose css: ${css}`);
  return css;
}

module.exports = create;