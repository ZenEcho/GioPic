<template>
    <div class="py-4 my-4 text-center">
        <n-ellipsis style="max-width: 500px" class="text-[2.25rem]">
            <n-gradient-text type="info">
                {{ webtitle || $t('GioPic') }}
            </n-gradient-text>
        </n-ellipsis>

    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
const webtitle = ref(null);
</script>