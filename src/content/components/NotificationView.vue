<script setup lang="ts">
import { useNotification } from 'naive-ui'
import { onMounted, onUnmounted } from 'vue'
import browser from 'webextension-polyfill'

const notification = useNotification()

const handleMessage = (message: any) => {
  if (message.type === 'SHOW_TOAST') {
    const { title, message: content, type = 'info', duration = 3000 } = message.data
    
    // Map types to Naive UI notification types
    const nType = (['info', 'success', 'warning', 'error'].includes(type) ? type : 'info') as 'info' | 'success' | 'warning' | 'error'
    
    notification[nType]({
      title: title,
      content: content,
      duration: duration,
      keepAliveOnHover: true,
      closable: true
    })
  }
}

onMounted(() => {
  browser.runtime.onMessage.addListener(handleMessage)
})

onUnmounted(() => {
  browser.runtime.onMessage.removeListener(handleMessage)
})
</script>

<template>
  <div style="display: none;"></div>
</template>
