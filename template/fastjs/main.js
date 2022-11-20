import './style.css'
import {selecter} from "fastjs-next";

selecter("#app").html(`
  <h1>Hello Fastjs!</h1>
  <div class="card">
      <button id="counter" type="button">count is 0</button>
  </div>
  <div class="select">
    <span>Fastjs&nbsp;|</span>
    <a href="https://docs.fastjs.com.cn/" target="_blank">Docs</a>
    <a href="https://github.com/fastjs-team/fastjs-next/" target="_blank">Github</a>
    <a href="https://fastjs.com.cn/" target="_blank">Website</a>
  </div>
  <div class="select">
    <span>Cli&nbsp;|</span>
    <a href="https://github.com/fastjs-team/fastjs-cli/" target="_blank">Github</a>
  </div>
`)

// mount click event
let time = 0;
let el = selecter("#counter");
el.on("click", () => {
  el.html(`count is ${++time}`);
})