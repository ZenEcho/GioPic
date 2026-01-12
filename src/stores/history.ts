import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { UploadRecord } from '@/types'
import { db } from '@/utils/storage'

const STORAGE_KEY = 'giopic-history'

export const useHistoryStore = defineStore('history', () => {
  const history = ref<UploadRecord[]>([])

  // 初始化加载
  async function loadHistory() {
    try {
      const stored = await db.get<UploadRecord[]>(STORAGE_KEY)
      if (stored) {
        history.value = stored
      }
    } catch (e) {
      console.error('Failed to load history from db', e)
    }
  }

  loadHistory()

  // 监听变化保存
  watch(history, async (newVal) => {
    try {
        await db.set(STORAGE_KEY, JSON.parse(JSON.stringify(newVal)))
    } catch (e) {
        console.error('Failed to save history to db', e)
    }
  }, { deep: true })

  function addRecord(record: UploadRecord) {
    history.value.unshift(record)
    // 限制历史记录数量，例如 1000 条
    if (history.value.length > 1000) {
      history.value = history.value.slice(0, 1000)
    }
  }

  function clearHistory() {
    history.value = []
  }

  function removeRecord(id: string) {
    history.value = history.value.filter(r => r.id !== id)
  }

  function removeRecords(ids: string[]) {
    history.value = history.value.filter(r => !ids.includes(r.id))
  }

  return {
    history,
    addRecord,
    clearHistory,
    removeRecord,
    removeRecords,
    loadHistory
  }
})
