#! /usr/bin/env node

const program = require('commander');
const output = require('./lib/console/output');

// Add line
output("")

program
  .name('fastjs')
  .description('Fastjs cli can help you build a npm project easily.')
  .version(`fastjs ${require('./package').version}`)
  .usage('<command> [options]');

program
  .command('create')
  .arguments('<name>')
  .description('create a new project powered by fastjs-cli')
  .option('-f, --force', 'overwrite target directory if it exists')
  .action((name, cmd) => {
    // require create fn and run
    require('./lib/create')(name, cmd);
  })

// if arguments name is not in the list, output error
program.on('command:*', function (operands) {
  output('Invalid command: ' + operands[0] +
    '\n' +
    '\nSee --help for a list of available commands.', 'red');
})

// parse arguments & run
program.parse(process.argv);