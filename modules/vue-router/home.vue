<script>
export default {
  name: "HelloWorld",
  props: {
    msg: String,
  },
  data() {
    return {
      count: 0,
    };
  },
}
</script>

<template>
  <div id="home">
    <h1>Hello Fastjs!</h1>

    <div class="card">
      <button type="button" @click="count++">count is {{ count }}</button>
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
    <div class="select">
      <span>Vue&nbsp;|</span>
      <a href="https://vuejs.org/guide/essentials/application.html" target="_blank">Docs</a>
      <a href="https://github.com/vuejs/" target="_blank">Github</a>
      <a href="https://vuejs.org/" target="_blank">Website</a>
    </div>
    <br/>
    <router-link to="/secret"><span style="color: red;font-weight: bold;font-size: 18px">USA Secret &gt;</span></router-link>
  </div>
</template>