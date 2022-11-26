import {createRouter, createWebHistory} from 'vue-router'
import Home from '../views/home/index.vue'
import Secret from "../views/secret/index.vue";

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/secret',
    name: 'Secret',
    component: Secret
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: routes
})

export default router