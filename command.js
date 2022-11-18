#! /usr/bin/env node

const program = require('commander');

program
  .name('fastjs')
  .description('Fastjs cli can help you build a npm project easily.')
  .usage('<command> [options]');

program
  .command('create')
  .arguments('<name>')
  .description('create a new project powered by fastjs-cli')
  .option('-f, --force', 'overwrite target directory if it exists')
  .action((name, cmd) => {
    // log
    console.log('test');
    require('lib/create.js')(name, cleanArgs(cmd));
  })

// if no arguments, output help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// if arguments name is not in the list, output error
program.on('command:*', function (operands) {
  console.log('\x1b[31m' +
    'Invalid command: ' + operands[0] +
    '\n' +
    '\nSee --help for a list of available commands.' +
    '\x1b[0m');
})

// [MIT] from https://github.com/vuejs/vue-cli/
function cleanArgs(cmd) {
  // setup args
  const args = {}
  cmd.options.forEach(arg => {
    const key = arg.long
      .replace(/^--/, '')
      .replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
    if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
      args[key] = cmd[key]
    }
  })
  return args
}