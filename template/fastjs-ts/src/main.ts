import './style.css'
import {selecter, FastjsDom, FastjsDomList} from "fastjs-next";

selecter("#app").html(`
  <h1>Hello Fastjs!</h1>
  <div class="card">
      <button id="counter" type="button">count is 0</button>
  </div>
  <div class="select">
    <span>Fastjs&nbsp;|</span>
    <a href="https://docs.fastjs.cc/" target="_blank">Docs</a>
    <a href="https://github.com/fastjs-team/fastjs-next/" target="_blank">Github</a>
    <a href="https://fastjs.cc/" target="_blank">Website</a>
  </div>
  <div class="select">
    <span>Cli&nbsp;|</span>
    <a href="https://github.com/fastjs-team/fastjs-cli/" target="_blank">Github</a>
  </div>
  <div class="select">
    <span>Typescript&nbsp;|</span>
    <a href="https://www.typescriptlang.org/docs/" target="_blank">Docs</a>
    <a href="https://github.com/topics/typescript" target="_blank">Github</a>
    <a href="https://www.typescriptlang.org/" target="_blank">Website</a>
  </div>
`)

// mount click event
let time: number = 0;
let el: FastjsDom | FastjsDomList = selecter("#counter");
el.on("click", () => {
    el.html(`count is ${++time}`);
})