const {pathExistsSync} = require('fs-extra');
const {join} = require("path");
const log = require("./output")

// check cwd/ondev.key
const _dev = pathExistsSync(join(process.cwd(), "ondev.key"));

async function output(text) {
  if (!_dev) return
  await log(`${text ? '[Dev] ' : ''}${text}`, "green")
}

module.exports = output;