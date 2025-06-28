import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import popupPage from '../views/popup/popup.vue'
import optionsPage from '../views/options/options.vue'
import uploadRecordsPage from '../views/uploadRecords/uploadRecords.vue'
const routes = [
  { path: '/', redirect: '/popup' },
  { path: '/popup', component: popupPage },
  { path: '/options', component: optionsPage },
  { path: '/uploadRecords', component: uploadRecordsPage },
  { path: '/:pathMatch(.*)*', redirect: '/popup' }
]
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
