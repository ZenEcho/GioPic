<template>
    <div class="flex flex-wrap justify-center py-6">
        <n-pagination v-model:page="page" v-model:page-size="pageSize" :page-count="getTotalPages()" show-size-picker
            :page-sizes="pageSizes" size="large" @update:page="pageChange" @update:page-size="pageSizeChange" />
    </div>
</template>

<script setup lang="ts">
import { usePagination } from '@/composables/uploadRecords/usePagination';
import { pageSizes } from '@/constants/uploadRecords';
import { useUploadRecordsStore } from '@/stores/uploadRecords';
import { storeToRefs} from 'pinia';
const {
    page,  //页码
    pageSize,  //每页数量
} = storeToRefs(useUploadRecordsStore()) //  保持响应式

const {
    pageChange,
    pageSizeChange,
    getTotalPages
} = usePagination();
</script>