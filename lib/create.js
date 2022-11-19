const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const output = require('./console/output');

async function create(name, options) {
  // output name
  await output(`Creating project *blue*${name}*blue*...`);
  // get current path
  const cwd = process.cwd();
  
}

module.exports = create;