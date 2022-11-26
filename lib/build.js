const output = require('./console/output');
const outputDev = require('./console/outputDev');
const load = require("ora");
const fs = require("fs-extra");
const path = require("path");
const pc = require("picocolors");
const {version: Version} = require("../package.json");

async function build(options) {
  // check ./package.json
  if (!fs.existsSync(path.join(process.cwd(), "package.json"))) {
    await output("package.json not found", "red");
    process.exit(1);
  }
  const startTime = Date.now();
  // close spin if dev
  await outputDev("Spinners are disabled in dev mode");
  const spinner = fs.pathExistsSync(path.join(process.cwd(), "ondev.key")) ? {} :
    load("Building project...").start();
  await outputDev("Building project...");
  await outputDev(`spawn in ${process.cwd()}`);
  await outputDev("")

  // setup output dir
  await outputDev(`options.output: ${options.output}`);
  await outputDev(`output: ${options.output || "dist"}`);
  await outputDev("")
  const outputDir = options.output || "dist";

  // check output dir
  if (options.output && (/^[a-zA-Z0-9-_\/.]+$/.test(input) || !/\.\./.test(input))) {
    await outputDev("Error: output dir is not valid");
    await outputDev("Program exit by error");
    await output("Error: output dir is not valid", "red");
    return
  }

  // setup input dir
  // if not exists
  if (!fs.existsSync(path.join(process.cwd(), outputDir))) {
    // create output dir
    await outputDev(`Creating dir ${path.join(process.cwd(), outputDir)}`);
    spinner.text = "Creating output dir...";
    fs.mkdirSync(path.join(process.cwd(), outputDir));
  } else {
    // clear output dir
    await outputDev(`Clearing dir ${path.join(process.cwd(), outputDir)}`);
    spinner.text = "Clearing output dir...";
    fs.emptyDirSync(path.join(process.cwd(), outputDir));
  }

  // run vite build
  await outputDev("Running vite build...");
  spinner.text = "Building project...";
  const {exec} = require("child_process");
  exec(`vite build`, {cwd: process.cwd()}, (err) => {
    if (err) {
      spinner.stop();
      outputDev("Error: vite build error");
      outputDev("Program exit by error");
      output("There was an error building the project, open dev mode to see more info", "red");
      return
    }
    // find fastjs_build_temp
    if (!fs.existsSync(path.join(process.cwd(), "fastjs_build_temp"))) {
      spinner.stop();
      outputDev("Error: fastjs_build_temp not found");
      outputDev("Program exit by error");
      output("There was an error building the project, open dev mode to see more info", "red");
      return
    }
    // move to output dir
    outputDev("Moving files to output dir...");
    fs.copySync(path.join(process.cwd(), "fastjs_build_temp"), path.join(process.cwd(), outputDir));
    // remove fastjs_build_temp
    outputDev("Removing fastjs_build_temp...");
    fs.removeSync(path.join(process.cwd(), "fastjs_build_temp"));
    // check fastjs_build_temp
    const printList = []
    // each file in fastjs_build_temp
    const readDir = (dir) => {
      // read dir
      outputDev(`Reading dir ${dir}`);
      fs.readdirSync(path.join(process.cwd(), outputDir, dir)).forEach((file) => {
        // if file is a dir
        if (fs.statSync(path.join(process.cwd(), outputDir, dir, file)).isDirectory()) {
          outputDev(`dir: ${path.join(process.cwd(), outputDir, dir, file)}`);
          readDir(path.join(dir, file));
          return
        }
        outputDev(`file: ${path.join(process.cwd(), outputDir, dir, file)}`);
        const filePath = path.join(outputDir, dir, file);
        const fileSizeByte = fs.statSync(path.join(process.cwd(), outputDir, dir, file)).size;
        let fileSize;
        switch (true) {
          case fileSizeByte < 1024:
            fileSize = `${fileSizeByte} B`;
            break;
          case fileSizeByte < 1024 * 1024:
            fileSize = `${(fileSizeByte / 1024).toFixed(2)} KB`;
            break;
          case fileSizeByte < 1024 * 1024 * 1024:
            fileSize = `${(fileSizeByte / 1024 / 1024).toFixed(2)} MB`;
            break;
          default:
            fileSize = `${(fileSizeByte / 1024 / 1024 / 1024).toFixed(2)} GB`;
        }
        printList.push(`*blue*${filePath}*blue* - *green*${fileSize}*green*`);
        outputDev(`${filePath} - ${fileSize}`);
      })
    }
    readDir("\\")
    // show success
    spinner.stop();
    output(`${pc.bold("[Fastjs-cli]")}`, "green");
    output("")
    output(`*green*${pc.bold("Fastjs-cli")} v${Version}*green* build success in ${Date.now() - startTime}ms`);
    outputDev(`Build time: ${Date.now() - startTime}ms`);
    outputDev("Program exit by success");
    output("")
    printList.forEach((file) => {
      output(`${file}`);
    })
    output("")
  })
}

module.exports = build;