import './style.css'
import { createApp } from 'vue'
import App from './App.vue'

declare global {
  interface Window {
    __GioPicPageScriptLoaded__?: boolean
  }
}

if (!window.__GioPicPageScriptLoaded__) {
  window.__GioPicPageScriptLoaded__ = true

  const rootId = 'giopic-page-root'

  const mount = () => {
    if (document.getElementById(rootId)) return
    const el = document.createElement('div')
    el.id = rootId
    el.className = 'giopic-page-root'
    document.documentElement.appendChild(el)

    createApp(App).mount(el)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true })
  } else {
    mount()
  }
}
