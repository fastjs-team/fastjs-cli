#! /usr/bin/env node

const program = require('commander');
const output = require('../lib/console/output');
const outputDev = require('../lib/console/outputDev');

// Add line
output("")

outputDev("Dev mode on")
outputDev("Remove file `ondev.key` to disable dev mode")

// get command name
const cmdName = process.argv[2];
outputDev(`Command: ${cmdName}`)

outputDev("")

program
  .name('fastjs')
  .description('Fastjs cli can help you build a npm project easily.')
  .version(`fastjs ${require('../package.json').version}`)
  .usage('<command> [options]');

program
  .command('create')
  .arguments('<name>')
  .description('create a new project powered by fastjs-cli')
  .option('-f, --force', 'overwrite target directory if it exists')
  .action((name, cmd) => {
    // require create fn and run
    require('../lib/create')(name, cmd);
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