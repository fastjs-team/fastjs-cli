const iq = require('inquirer');

async function select(choices, message) {
  const {answer} = await iq.prompt([{
    type: 'list',
    name: "answer",
    message: message,
    choices: choices
  }])
  return answer
}

async function input(message, { auto, verify }) {
  const {answer} = await iq.prompt([{
    type: 'input',
    name: "answer",
    message: message,
    default: auto,
    validate: verify
  }])
  return answer
}

async function confirm(message, defaultVal) {
  const {answer} = await iq.prompt([{
    type: 'confirm',
    name: "answer",
    message: message,
    default: defaultVal
  }])
  return answer
}

async function checkbox(choices, message) {
  const {answer} = await iq.prompt([{
    type: 'checkbox',
    name: "answer",
    message: message,
    choices: choices
  }])
  return answer
}

module.exports = {
  select,
  input,
  confirm,
  checkbox
}