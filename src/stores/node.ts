import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { DriveConfig } from '@/types'
import { db } from '@/utils/storage'

const STORAGE_KEY = 'giopic-configs'
const SELECTED_IDS_KEY = 'giopic-selected-ids'

export const useConfigStore = defineStore('config', () => {
  const configs = ref<DriveConfig[]>([])
  const selectedIds = ref<string[]>([])

  // 初始化加载
  Promise.all([
    db.get<DriveConfig[]>(STORAGE_KEY),
    db.get<string[]>(SELECTED_IDS_KEY)
  ]).then(([storedConfigs, storedSelection]) => {
    if (storedConfigs) {
      configs.value = storedConfigs
    }
    
    if (storedSelection !== undefined) {
      selectedIds.value = storedSelection
    } else if (configs.value.length > 0) {
      // 默认全选
      selectedIds.value = configs.value.map(c => c.id)
    }
  }).catch(e => {
    console.error('Failed to load data from db', e)
  })

  // 监听 selectedIds 保存
  watch(selectedIds, async (newVal) => {
    try {
      await db.set(SELECTED_IDS_KEY, JSON.parse(JSON.stringify(newVal)))
    } catch (e) {
      console.error('Failed to save selectedIds to db', e)
    }
  }, { deep: true })

  // 监听变化保存
  watch(configs, async (newVal) => {
    // 使用 JSON.parse(JSON.stringify(newVal)) 去除 Vue 的响应式代理，
    // 虽然 idb/structuredClone 通常能处理，但为了安全起见或者避免 Proxy 问题
    try {
        await db.set(STORAGE_KEY, JSON.parse(JSON.stringify(newVal)))
    } catch (e) {
        console.error('Failed to save configs to db', e)
    }
  }, { deep: true })

  function addConfig(config: DriveConfig) {
    configs.value.push(config)
  }

  function updateConfig(id: string, newConfig: DriveConfig) {
    const index = configs.value.findIndex(c => c.id === id)
    if (index !== -1) {
      configs.value[index] = newConfig
    }
  }

  function removeConfig(id: string) {
    configs.value = configs.value.filter(c => c.id !== id)
    selectedIds.value = selectedIds.value.filter(cid => cid !== id)
  }

  function toggleEnabled(id: string) {
    const config = configs.value.find(c => c.id === id)
    if (config) {
      config.enabled = !config.enabled
    }
  }

  async function reload() {
    try {
      const [storedConfigs, storedSelection] = await Promise.all([
        db.get<DriveConfig[]>(STORAGE_KEY),
        db.get<string[]>(SELECTED_IDS_KEY)
      ])
      configs.value = storedConfigs || []
      if (storedSelection !== undefined) {
        selectedIds.value = storedSelection
      } else if (configs.value.length > 0) {
        selectedIds.value = configs.value.map(c => c.id)
      } else {
        selectedIds.value = []
      }
    } catch (e) {
      console.error('Failed to reload data from db', e)
    }
  }

  return {
    configs,
    selectedIds,
    addConfig,
    updateConfig,
    removeConfig,
    toggleEnabled,
    reload
  }
})
