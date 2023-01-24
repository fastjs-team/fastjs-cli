const output = require('./console/output');
const outputDev = require('./console/outputDev');
const loader = require('./console/loader');
const clear = require("./console/clean");
const fs = require("fs-extra");
const path = require("path");
const pc = require("picocolors");

async function dev(options) {
  // check ./package.json
  if (!fs.existsSync(path.join(process.cwd(), "package.json"))) {
    await output("package.json not found", "red");
    process.exit(1);
  }
  const startTime = Date.now();
  // close spin if dev
  await outputDev("Spinners are disabled in dev mode");
  const load = new loader("Starting dev server", "Checking port", 2);
  await outputDev("Starting dev server...");
  await outputDev(`spawn in ${process.cwd()}`);
  await outputDev("")
  // setup port
  await outputDev(`options.port: ${options.port}`);
  await outputDev(`port: ${options.port || 3000}`);
  await outputDev("")
  let port = options.port || 3000;
  if (options.port) {
    // check is number
    if (isNaN(options.port) || options.port.length !== 4) {
      load.end();
      await outputDev("Error: port is not a number");
      await outputDev("Program exit by error");
      await output("Error: port should be a 4 sig number", "red");
      return
    } else if (await checkPort(port)) {
      load.end();
      await outputDev("Error: port is busy");
      await outputDev("Program exit by error");
      await output("Error: port is busy", "red");
      return
    }
  } else {
    const portfinder = require("portfinder");
    portfinder.getPort({
      port: 3000,
      stopPort: 4000
    }, (err, active) => {
      if (err) {
        load.end();
        outputDev("Error: port 3000-4000 all busy");
        outputDev("Program exit by error");
        output("Error: port 3000-4000 all busy", "red");
        return
      }
      port = active;
    })
  }
  // run command `vite` and listen for stdout
  const {exec} = require("child_process");
  load.update("Starting server", 1);
  const vite = exec(`vite --port ${port}`, {cwd: process.cwd()}, error => {
    if (error) {
      load.end();
      outputDev(error);
      outputDev("Program exit by error");
      output(String(error))
      return;
    }
    load.end();
    outputDev("Program exit by vite");
  });
  vite.stdout.on("data", data => {
    // if include `ready in` then vite is ready
    if (data.toString().includes("ready in")) {
      load.end();
      clear()
      output(`${pc.bold("[Fastjs-cli]")}`, "green");
      output("")
      const Version = require("../package.json").version;
      output(`*green*${pc.bold("Fastjs-cli")} v${Version}*green* is ready in ${Date.now() - startTime}ms`);
      output("")
      output(` > ${pc.bold("Local")}: http://localhost:${port}`);
      output(` > ${pc.bold("Close")}: Ctrl + C`);
    }
  })
}

module.exports = dev;