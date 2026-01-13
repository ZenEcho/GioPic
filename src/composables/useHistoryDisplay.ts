import { ref, computed, watch, type Ref } from 'vue'
import type { UploadRecord } from '@/types'
import { useI18n } from 'vue-i18n'

export function useHistoryDisplay(history: Ref<UploadRecord[]>) {
    const { t } = useI18n()
    
    const searchQuery = ref('')
    const filterConfig = ref<string | null>(null)
    const sortBy = ref('timeDesc')
    
    // 分页相关
    const page = ref(1)
    const pageSize = 24 // 每页显示的图片数量
    
    const sortOptions = computed(() => [
        { label: t('home.history.sortTimeDesc'), value: 'timeDesc' },
        { label: t('home.history.sortTimeAsc'), value: 'timeAsc' },
        { label: t('home.history.sortNameAsc'), value: 'nameAsc' },
        { label: t('home.history.sortNameDesc'), value: 'nameDesc' }
    ])

    const configOptions = computed(() => {
        const names = new Set(history.value.map(r => r.configName))
        return Array.from(names).map(name => ({ label: name, value: name }))
    })

    // 经过筛选和排序的完整列表
    const sortedAndFilteredList = computed(() => {
        let result = [...history.value]

        if (searchQuery.value) {
            const query = searchQuery.value.toLowerCase()
            result = result.filter(r => r.filename.toLowerCase().includes(query))
        }

        if (filterConfig.value) {
            result = result.filter(r => r.configName === filterConfig.value)
        }

        result.sort((a, b) => {
            switch (sortBy.value) {
                case 'timeAsc': return a.createdAt - b.createdAt
                case 'timeDesc': return b.createdAt - a.createdAt
                case 'nameAsc': return a.filename.localeCompare(b.filename)
                case 'nameDesc': return b.filename.localeCompare(a.filename)
                default: return 0
            }
        })

        return result
    })

    // 当前展示的列表（分页后）
    const displayList = computed(() => {
        return sortedAndFilteredList.value.slice(0, page.value * pageSize)
    })
    
    const hasMore = computed(() => {
        return displayList.value.length < sortedAndFilteredList.value.length
    })

    function loadMore() {
        if (hasMore.value) {
            page.value++
        }
    }

    // 当筛选条件变化时，重置分页
    watch([searchQuery, filterConfig, sortBy], () => {
        page.value = 1
    })
    
    // 当原始数据变化时（如删除），也要重置或重新计算（computed会自动处理，但如果删除了当前页的数据，可能需要检查）
    watch(history, () => {
        page.value = 1
    })

    return {
        searchQuery,
        filterConfig,
        sortBy,
        sortOptions,
        configOptions,
        displayList,
        sortedAndFilteredList,
        hasMore,
        loadMore
    }
}
