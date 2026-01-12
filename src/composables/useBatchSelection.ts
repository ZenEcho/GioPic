import { ref, computed, type Ref } from 'vue'

export function useBatchSelection(items: Ref<any[]>) {
    const isBatchMode = ref(false)
    const selectedIds = ref<Set<string>>(new Set())

    const isAllSelected = computed(() => {
        return items.value.length > 0 && selectedIds.value.size === items.value.length
    })

    const hasSelected = computed(() => selectedIds.value.size > 0)

    function toggleBatchMode() {
        isBatchMode.value = !isBatchMode.value
        if (!isBatchMode.value) {
            selectedIds.value = new Set()
        }
    }

    function toggleSelection(id: string) {
        if (!isBatchMode.value) return
        const newSet = new Set(selectedIds.value)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        selectedIds.value = newSet
    }

    function toggleSelectAll() {
        if (isAllSelected.value) {
            selectedIds.value = new Set()
        } else {
            selectedIds.value = new Set(items.value.map(record => record.id))
        }
    }
    
    function clearSelection() {
        selectedIds.value = new Set()
    }

    return {
        isBatchMode,
        selectedIds,
        isAllSelected,
        hasSelected,
        toggleBatchMode,
        toggleSelection,
        toggleSelectAll,
        clearSelection
    }
}
