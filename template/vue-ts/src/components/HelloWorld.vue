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
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
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
    <span>Vue&nbsp;|</span>
    <a href="https://vuejs.org/guide/essentials/application.html" target="_blank">Docs</a>
    <a href="https://github.com/vuejs/" target="_blank">Github</a>
    <a href="https://vuejs.org/" target="_blank">Website</a>
  </div>
  <div class="select">
    <span>Typescript&nbsp;|</span>
    <a href="https://www.typescriptlang.org/docs/" target="_blank">Docs</a>
    <a href="https://github.com/topics/typescript" target="_blank">Github</a>
    <a href="https://www.typescriptlang.org/" target="_blank">Website</a>
  </div>
</template>
