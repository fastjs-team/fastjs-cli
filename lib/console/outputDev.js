const {pathExistsSync} = require('fs-extra');
const {join} = require("path");
const log = require("./output")

// check cwd/ondev.key
const _dev = pathExistsSync(join(process.cwd(), "ondev.key"));
const _version = require("../../package.json").version;

async function output(text) {
  if (!_dev) return
  await log(`${text ? `[Dev v${_version}] ` : ''}${text}`, "green")
}

module.exports = output;