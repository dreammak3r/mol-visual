import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import Compare2D from '../views/Compare2D.vue'
import Compare3D from '../views/Compare3D.vue'

const routes = [
  { path: '/', name: 'Home', component: HomePage },
  { path: '/2d', name: 'Compare2D', component: Compare2D },
  { path: '/3d', name: 'Compare3D', component: Compare3D },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
