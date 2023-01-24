const fs = require('fs-extra');
const path = require('path');
const _path = path
const output = require('./console/output');
const outputDev = require('./console/outputDev');
const config = require('./config.json');
const {exec, execSync} = require('child_process');
const ask = require('./ask');
const err = require('./console/error');
const loader = require('./console/loader');

// get command path
const runPath = process.cwd()

async function create(name, options) {
  // output name
  await output(`Creating project *blue*${name}*blue*...`);


  /*   Project info - name, path   */


  // Project name
  if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
    await outputDev("Project name invalid, exit");
    await output("Please input a valid name.", "red");
    return;
  }

  // Project path
  let createPath
  if (options.path) {
    await outputDev("Option -p --path <path> found");
    createPath = _path.join(runPath, options.path)
  } else {
    // ask for exact path
    createPath = await askForPath(path.join(runPath, name));
  }
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
      const overwrite = await ask.select(
        ["Overwrite", "Merge", "Cancel"],
        "Target directory exists. Choose an action:"
      )
      await outputDev("User choose " + overwrite);
      if (overwrite === "Cancel") {
        await outputDev("Program exit by user")
        return;
      }
      if (overwrite === "Overwrite") {
        fs.removeSync(createPath);
        // check create path is exists
        if (fs.existsSync(createPath)) {
          await outputDev("Path still exists");
          err(
            "Error 901: Path remove failed",
            "It may be occupied by other programs.",
            "Remove: " + createPath
          )
        }
      }
    }
  }


  /*   Project type, modules   */


  // ask for project type
  const projectType = await askForType();
  const projectTypeName = projectType.name;
  const projectTypeSuper = projectType.parent
  await outputDev(`Project type: ${projectTypeSuper}`);
  // ask for modules
  const modules = await askForModules();
  // find modules
  const moduleConfigList = [];
  modules.forEach((item) => {
    moduleConfigList.push(require(path.join(__dirname, item.path, "cli-config.json")));
  })
  // check modules parent
  modules.forEach((item) => {
    outputDev(`Module: ${item.name}`);
    // list item's parent
    const itemSuper = config.modules.find((item2) => {
      return item2.name === item.name
    })
    // if projectType is not in item.parent: Array<String>
    if (!itemSuper.parent.includes(projectTypeName) && itemSuper.parent.length) {
      // outputDev("Module parent not match project type");
      // outputDev("Program exit by error");
      // output(`Module *blue*${item.name}*blue* *red*is not support for project type*red* *blue*${projectTypeName}*blue*`, "red");
      // output(`Use *blue*${itemSuper.parent.toString()}*blue* *red*to create a project*red*`, "red");
      err(
        "Error 900: Project type incompatible with module",
        `Module: ${item.name}`,
        `Project type: ${projectTypeName}`,
        `Module parent: ${itemSuper.parent.toString()}`,
      );
    }
  })


  /*   Project info - css loader   */


  // ask css
  const cssLoader = await askForCss();
  const cssLoaderReplace = cssLoader === "sass" ? "scss" : cssLoader;
  // const {installAfterSetup} = await inquirer.prompt([{
  //   type: 'confirm',
  //   name: 'installAfterSetup',
  //   message: 'Install dependencies after create? (Yes)',
  //   default: true
  // }]);
  const autoInstall = await ask.confirm("Install dependencies after create? (Yes)", true);


  /*   Create project   */


  // start create
  await outputDev("Start create project");
  await outputDev(`Project type: ${projectTypeName}`);
  await outputDev(`Project type super: ${projectTypeSuper}`);
  // close loader dev
  await outputDev("Loader are disabled in dev mode");
  await output("")
  let load = new loader("Preparing create project", "Checking path", 3);
  // start time
  const startTime = new Date().getTime();
  // check fastjs_cli_create is exists
  if (fs.existsSync(path.join(runPath, "fastjs_cli_create"))) {
    load.update("Clearing temp", "+1");
    await outputDev("fastjs_cli_create exists");
    await outputDev("Remove fastjs_cli_create");
    fs.removeSync(path.join(runPath, "fastjs_cli_create"));
  }
  load.update("Checking npm version", 2);
  // check npm version to number
  const npmVersion = require("child_process").execSync("npm -v", {stdio: "pipe"}).toString()
  const npmVersionNum = Number(npmVersion.split(".")[0])
  await outputDev(`npm version: ${npmVersionNum}`);
  // if npm version >= 7
  const EXTRA_ARGS = npmVersionNum >= 7 ? "-- " : "";
  await outputDev(`EXTRA_ARGS: ${EXTRA_ARGS}`);
  load.end()
  // do create command
  load = new loader("Creating project", "Install template", 2);
  await outputDev("Install template");


  /*   Create project - install template   */


  try {
    await execSync(`npm create vite@latest fastjs_cli_create ${EXTRA_ARGS}--template ${projectTypeSuper}`, {
      cwd: runPath,
      stdio: 'ignore'
    })
  } catch (error) {
    await outputDev(error);
    err(
      "Error 940: Error when doing command",
      "child_process.exec()",
      `npm create vite@latest fastjs_cli_create ${EXTRA_ARGS}--template ${projectTypeSuper}`,
      `Project type: ${projectTypeSuper}`,
      `Project name: ${name}`,
      `Project path: ${createPath}`,
    );
  }

  load.update("Moving template", 1);
  await outputDev("move to new path");
  // ./fastjs_cli_create -> createPath
  // noinspection JSCheckFunctionSignatures
  await outputDev(`move ./fastjs_cli_create to ${createPath}`);
  // fs.moveSync(`${runPath}/fastjs_cli_create`, createPath);
  const files = fs.readdirSync(`${runPath}/fastjs_cli_create`);
  files.forEach((file) => {
    load.update(`Moving ${file}`, "+1", "+1");
    // check file is exists
    if (fs.existsSync(path.join(createPath, file))) {
      // delete file
      load.update(`Removing old ${file}`, "+1", "+1");
      fs.removeSync(path.join(createPath, file));
    }
    fs.moveSync(`${runPath}/fastjs_cli_create/${file}`, `${createPath}/${file}`);
  })
  fs.removeSync(`${runPath}/fastjs_cli_create`);
  load.end();
  load = new loader("Install dependencies", "Install fastjs", autoInstall ? 2 : 1);
  await outputDev("Install fastjs");


  /*   Install fastjs, fastjs-cli for project   */


  try {
    execSync(`npm install fastjs-next fastjs-cli`, {cwd: createPath, stdio: 'ignore'})
  } catch (error) {
    await outputDev(error);
    err(
      "Error 940: Error when doing command",
      "child_process.exec()",
      `npm install fastjs-next fastjs-cli`,
      `Project path: ${createPath}`,
    );
  }
  // install dependencies
  if (autoInstall) {
    await outputDev("Install dependencies");
    load.update("npm install", 1);
    try {
      execSync(`npm install`, {cwd: createPath, stdio: 'ignore'})
    } catch (error) {
      // print log (<run-path>/fastjs-cli-<timestamp>.error.log)
      const errorLog = path.join(runPath, `fastjs-cli-${startTime}.error.log`);
      fs.createFileSync(errorLog);
      fs.writeFileSync(errorLog, error);
      err(
        "Error 940: Error when doing command",
        "child_process.execSync()",
        `npm install`,
        `Project path: ${createPath}`,
        `Error log: ${errorLog}`,
      )
      load.end();
      process.exit(1)
    }
    await outputDev("Install dependencies success");
  }
  load.end()


  /*   Create project - Config   */


  load = new loader("Project setup", "Get package.json", 19);
  // edit package.json && package-lock.json name
  await outputDev("Update package");
  const packageJson = require(path.join(createPath, "package.json"));
  // check package-lock.json
  load.update("Check package-lock.json", 1);
  if (fs.existsSync(path.join(createPath, "package-lock.json"))) {
    load.update("Read package-lock.json", 2);
    const packageLockJson = require(path.join(createPath, "package-lock.json"));
    load.update("Update package-lock.json - name", 3);
    packageLockJson.name = name;
    load.update("Write package-lock.json", 4);
    fs.writeFileSync(path.join(createPath, "package-lock.json"), JSON.stringify(packageLockJson, null, 2));
  }
  load.update("Update package.json - name", 5);
  packageJson.name = name;
  load.update("Write package.json - scripts", 6);
  packageJson.scripts = {
    dev: "fastjs dev",
    build: "fastjs build",
  }
  load.update("Write package.json", 7);
  fs.writeFileSync(path.join(createPath, "package.json"), JSON.stringify(packageJson, null, 2));
  // copy template
  await outputDev("Copy resources");
  load.update("Copy resources", 8);
  // copy ./template/projectTypeSuper to createPath
  // noinspection JSCheckFunctionSignatures
  fs.copySync(path.join(__dirname, "..", "template", projectTypeName), createPath);
  await outputDev("Copy resources success in " + createPath);
  // read createPath/cli-config.json
  load.update("Read cli-config.json", 9);
  const cliConfig = require(path.join(createPath, "cli-config.json"));
  const deleteList = cliConfig.rm;
  // delete files
  await outputDev("Delete files");
  load.update("Delete files", 10);
  deleteList.forEach((item) => {
    load.update(`Delete ${item}`, "+1", "+1");
    fs.removeSync(path.join(createPath, item));
  })
  const isTs = projectTypeName.indexOf("ts") !== -1;
  // delete cli-config.json
  load.update("Delete cli-config.json", "+1");
  fs.removeSync(path.join(createPath, "cli-config.json"))
  // check vite.config
  await outputDev("Config setup");
  load.update("Check vite.config", "+1");
  // update vite.config
  await outputDev("Setup vite.config");
  load.update("Setup vite.config", "+1");
  const viteConfig = {
    base: "./",
    build: {
      outDir: "./fastjs_build_temp/",
    },
    plugins: [],
    resolve: {
      extensions: ['index', '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
      alias: {
        "@": "/ig/path.resolve(__dirname, \"src\")/ig/",
      }
    }
  };
  const viteImport = [
    'import path from "path";'
  ];
  // install css preprocessor
  load.update("Check css preprocessor", "+1");
  if (cssLoader !== "css") {
    load.update("Install css preprocessor", "+1");
    await outputDev(`Install css preprocessor ${cssLoader} ${cssLoader}-loader`);
    try {
      exec(`npm install ${cssLoader} ${cssLoader}-loader`, {cwd: createPath, stdio: 'ignore'})
    } catch (error) {
      // print log (<run-path>/fastjs-cli-<timestamp>.error.log)
      const errorLog = path.join(runPath, `fastjs-cli-${startTime}.error.log`);
      fs.createFileSync(errorLog);
      fs.writeFileSync(errorLog, error);
      err(
        "Error 940: Error when doing command",
        "child_process.execSync()",
        `npm install ${cssLoader} ${cssLoader}-loader`,
        `Project path: ${createPath}`,
        `Error log: ${errorLog}`,
      )
      load.end();
      process.exit(1)
    }
    load.update("Install plugins", "+1");
  }
  load.update("Install plugins", "+2");


  /*   Install plugins   */


  cliConfig.plugins.forEach((plugin) => {
    load.update(`Setup ${plugin.name}`, "+1", "+1");
    outputDev(`Add ${projectTypeName} plugin: ${plugin.name}`);
    plugin.depends.forEach((depend) => {
      load.update(`Update vite.config - plugins - ${depend}`, "+1", "+1");
      outputDev(`Add ${plugin.name} plugin depend: ${depend}`);
      viteImport.push(depend);
    })
    plugin.commands.forEach((command) => {
      load.update(`Update vite.config - import - ${plugin.name}`, "+1", "+1");
      outputDev(`Add ${plugin.name} plugin command: ${command}`);
      viteConfig.plugins.push(command);
    })
  })
  // install modules
  modules.forEach((item) => {
    outputDev(`Install module ${item.name}`);
    load.update(`Install module ${item.name}`, "+1", "+2");
    // check ./config.json and find module
    load.update(`Read ${item.name} config`, "+1");
    const moduleConfig = item;
    item = moduleConfig.name;
    // check {moduleConfig.path}/cli-config.json
    const moduleCliConfig = require(path.join(moduleConfig.path, "cli-config.json"));
    // install module dependencies
    moduleCliConfig.depends.forEach((depend) => {
      // child process disallow output to console
      load.update(`Install ${item} depend ${depend}`, "+1", "+1");
      execSync(`npm install ${depend}`, {cwd: createPath, stdio: 'ignore'});
    })
    // mkdir
    moduleCliConfig.mkdir.forEach((dir) => {
      // mkdir -> dir
      load.update(`Create ${item} dir ${dir}`, "+1", "+1");
      outputDev(`Install module ${item} setup: mkdir ${dir}`);
      const pathList = dir.split("/");
      // each path create to avoid ENOENT
      let pathTemp = createPath;
      pathList.forEach((pathItem) => {
        if (!fs.existsSync(path.join(pathTemp, pathItem)))
          fs.mkdirSync(path.join(pathTemp, pathItem));
        pathTemp = path.join(pathTemp, pathItem);
      })
    })
    // copy files
    moduleCliConfig.files.forEach((file) => {
      // {
      //   from: <dir>
      //   to: <dir>
      // }
      // copy from -> to

      outputDev(`Install module ${item} setup: copy ${file.from} to ${file.to}`);
      load.update(`Move ${file.from} to ${file.to}`, "+1", "+1");
      // noinspection JSCheckFunctionSignatures
      fs.copySync(path.join(__dirname, moduleConfig.path, file.from), path.join(createPath, file.to));
    })
    // rm files
    moduleCliConfig.rm.forEach((file) => {
      outputDev(`Install module ${item} setup: rm ${file}`);
      load.update(`Delete ${file}`, "+1", "+1");
      fs.removeSync(path.join(createPath, file));
    })
  })


  /*   Read all file and do sth.   */


  const ignoreKeyword = ["node_modules", ".git", ".idea", ".vscode", "fastjs_build_temp"];
  // read all files and replace <style> -> <style lang="${cssLoaderReplace}">
  const readDir = (dir) => {
    load.update(`Read ${dir}`, "+1", "+1");
    // if ignore keyword
    if (ignoreKeyword.some((item) => dir.includes(item))) {
      return
    }
    // keep
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
      // replace <style> -> <style lang="${cssLoaderReplace}">
      // get file content
      const fileContent = fs.readFileSync(path.join(createPath, dir, file), "utf-8");
      // replace
      const newFileContent = fileContent
        .replace(/<style>/g, `<style lang="${cssLoaderReplace}">`)
        .replace(/<style scoped>/g, `<style scoped lang="${cssLoaderReplace}">`)
        .replace(/\.css/g, `.${cssLoaderReplace}`);
      // if file === *.css
      if (file.endsWith(".css")) {
        // rename file
        fs.renameSync(path.join(createPath, dir, file), path.join(createPath, dir, file.replace(".css", `.${cssLoaderReplace}`)));
        file = file.replace(".css", `.${cssLoaderReplace}`);
      }
      // write file
      fs.writeFileSync(path.join(createPath, dir, file), newFileContent);
    })
  }
  if (cssLoader !== "css") {
    readDir("/");
    load.update("Update vite.config - css", "+1", "+1");
    viteConfig.css = {}
    load.update("Update vite.config - css.preprocessorOptions", "+1", "+1");
    viteConfig.css.preprocessorOptions = {
      [cssLoader]: {
        javascriptEnabled: true
      }
    }
  }
  // if vue project
  if (projectTypeName.indexOf("Vue") !== -1) {
    // rewrite src/main.js
    // vue use
    let useList = ""
    moduleConfigList.forEach((module) => {
      outputDev(`Add ${module.name} module use`);
      // module.main.use each
      module.main.use.forEach((use) => {
        outputDev(`Add ${module.name} module use: ${use}`);
        useList += `.use(${use})`
      })
    })
    // vue import
    let importList = ""
    moduleConfigList.forEach((module) => {
      outputDev(`Add ${module.name} module import`);
      // module.main.file each
      module.main.file.forEach((file) => {
        outputDev(`Add ${module.name} module import: ${file}`);
        importList += file + "\n";
      })
    })
    await outputDev(`importList:\n${importList}`);
    await outputDev(`useList: ${useList}`);
    const mainJs =
      `import {createApp} from 'vue'
import App from './App.vue'
import './style.${cssLoaderReplace}'
${importList}
const app = createApp(App)

app${useList}.mount('#app')`
    // write main.js || main.ts
    const writePath = projectTypeSuper === "vue" ? path.join(createPath, "src", "main.js") : path.join(createPath, "src", "main.ts");
    load.update(`Write ${writePath}`, "+1", "+1");
    fs.writeFileSync(writePath, mainJs);
  }

  moduleConfigList.forEach((module) => {
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


  /*   Edit vite.config.js   */


  // write vite.config
  await outputDev("Write vite.config");
  let writeString = ""
  viteImport.forEach((item) => {
    writeString += item + "\n"
  })
  writeString += "\n" + "export default " + JSON.stringify(viteConfig, null, 2)
    .replace(/("\/ig\/)|(\/ig\/")/g, "")
    .replace(/\\"/g, '"')
  viteConfig.plugins.forEach((item) => {
    writeString = writeString.replace(`"${item}"`, item)
  })
  load.update("Write vite.config", "+1");
  fs.writeFileSync(path.join(createPath, "vite.config" + (isTs ? ".ts" : ".js")), writeString);
  load.end()
  await output("")
  await outputDev("Program create success in " + createPath);
  await output(`Project *blue*${name}*blue* created in *blue*${createPath}*blue*`);
  await output("")
  await output(`Project create success in ${Math.floor((new Date().getTime() - startTime) / 1000)}s`);
  await output("")
  await output("To get started:", "green");
  await output("- npm run dev", "green");
  await output("");
}

async function askForPath(path) {
  // ask ok or not
  const confirm = await ask.confirm("Create project in " + path + "? (Yes)", true);
  if (!confirm) {
    // not ok
    await outputDev("User cancel, retry");
    // ask for new path
    let path = await ask.input("Please input a new path:", {
      auto: "./",
      validate: function (input) {
        return /^[a-zA-Z0-9-_\/.]+$/.test(input) && !/\.\./.test(input) ? true : "Please input a valid path.";
      }
    });
    await output("")
    path = _path.join(runPath, path)
    path = askForPath(path);
    return path;
  }
  await outputDev("User confirm, continue");
  return path;
}

async function askForType() {
  // ask for project type
  const type = await ask.select(
    config.project.map(item => item.name),
    "Please select a project type:",
  )
  if (type === "jQuery") {
    err("Error 418: Unexpected choice", "See https://httpstatuses.com/418 to learn more.")
  }
  await outputDev(`User choose project type: ${type}`);
  // return type (change type.name to type)
  return config.project.find(item => item.name === type);
}

async function askForModules() {
  // ask for modules
  const modules = await ask.checkbox(
    // if on === true, delete, else keep, and map item.name
    // config.modules.map(item => item.name)
    config.modules.filter(item => item.on !== true).map(item => item.name),
    "Please select modules:")
  // each
  config.modules.forEach((item) => {
    // if on
    if (item.on) modules.push(item.name);
  })
  // change item.name[] to item[]
  const moduleList = [];
  modules.forEach((item) => {
    moduleList.push(config.modules.find(module => module.name === item));
  })

  await outputDev(`User choose modules: ${modules}`);
  return moduleList;
}

async function askForCss() {
  // ask for css
  const css = await ask.select(["css", "sass", "less", "stylus"], "Please select a css preprocessor:");
  await outputDev(`User choose css: ${css}`);
  return css;
}

module.exports = create;