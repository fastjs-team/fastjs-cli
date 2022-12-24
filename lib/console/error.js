const pc = require("picocolors")

function error(...msgList) {
  let output = "\n";
  msgList.forEach((msg) => {
    const line = pc.bgRed(pc.white(" !ERR ")) + " " + pc.red(msg);
    output += "\n" + line;
  })
  console.log(output)
  process.exit(1)
}

module.exports = error