#! /usr/bin/env node

const program = require('commander');
const output = require('../lib/console/output');
const outputDev = require('../lib/console/outputDev');

outputDev("Dev mode *green*on")
outputDev("Remove file `ondev.key` to disable dev mode")
outputDev(`Version: ${require('../package.json').version}`)

// get command name
const cmdName = process.argv[2];
outputDev(`Command: ${cmdName}`)

// Add line
output("")

// command setup
program
  .name('fastjs')
  .description('Fastjs cli can help you build a npm project easily.')
  .version(`fastjs-cli ${require('../package.json').version}`)
  .usage('<command> [options]');

program
  .command('create')
  .arguments('<name>')
  .description('create a new project powered by fastjs-cli')
  .option('-f, --force', 'overwrite target directory if it exists')
  .option('-p, --path <path>', 'create project in a specific directory')
  .action((name, cmd) => {
    // require create fn and run
    require('../lib/create')(name, cmd);
  })

program
  .command('dev')
  .description('start a dev server')
  .option('-p, --port <port>', 'set dev server port')
  .action((cmd) => {
  // require start fn and run
    require('../lib/dev')(cmd);
  })

program
  .command('build')
  .description('build a project')
  .option('-p, --path <path>', 'build project in a specific directory')
  .action((cmd) => {
  // require build fn and run
    require('../lib/build')(cmd);
  })

// if arguments name is not in the list, output error
program.on('command:*', function (operands) {
  outputDev("Error: unknown command " + operands[0]);
  output('Invalid command: ' + operands[0] +
    '\n' +
    '\nSee --help for a list of available commands.', 'red');
})

// parse arguments & run
program.parse(process.argv);