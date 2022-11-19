async function output(text, color) {
  const colorList = [
    ["red", "\x1b[31m"],
    ["green", "\x1b[32m"],
    ["yellow", "\x1b[33m"],
    ["blue", "\x1b[34m"]
  ]
  const colorEnd = "\x1b[0m";
  let colorCode = "\x1b[0m";
  for (let i = 0; i < colorList.length; i++) {
    if (colorList[i][0] === color) {
      colorCode = colorList[i][1];
    }
    // check token *blue*text*blue*
    while (text.includes(`*${colorList[i][0]}*`)) {
      text = text.replace(`*${colorList[i][0]}*`, colorList[i][1]);
      text = text.replace(`*${colorList[i][0]}*`, colorEnd);
    }
  }
  console.log(colorCode + text + colorEnd);
}

module.exports = output;