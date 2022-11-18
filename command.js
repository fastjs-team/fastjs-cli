#! /usr/bin/env node

const program = require('commander');

program
  .version(`fastjs-cli ${require('package.json').version}`)
  .usage('<command> [options]');

program
  .command('create <app-name>')
  .description('create a new project powered by fastjs-cli')
  .option('-f, --force', 'overwrite target directory if it exists')
  .action((name, cmd) => {
    require('lib/create.js')(name, cleanArgs(cmd));
  })

