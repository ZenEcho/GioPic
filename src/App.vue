<script setup lang="ts">
import { computed } from 'vue';
import { RouterView } from 'vue-router'
import { darkTheme, lightTheme } from 'naive-ui'
import { useAppSettings } from '@/stores/appSettings';
import { storeToRefs } from 'pinia'

const { setSidebarCollapsed } = useAppSettings()
const {
  DarkMode,
  SidebarCollapsed,
} = storeToRefs(useAppSettings())

const currentTheme = computed(() => (DarkMode.value ? darkTheme : lightTheme));
function handleSiderClick() {
  setSidebarCollapsed(!SidebarCollapsed.value)
}
</script>

<template>
  <n-config-provider :theme="currentTheme">
    <n-notification-provider>
      <n-message-provider>
        <n-layout has-sider class="flex flex-row h-screen min-h-[500px] min-w-[500px]">
          <n-layout-sider bordered :collapsed="SidebarCollapsed" collapse-mode="width" :width="260" :collapsed-width="64"
            show-trigger="bar" @update:collapsed="handleSiderClick">
            <Sidebar />
          </n-layout-sider>
          <n-layout>
            <RouterView />
          </n-layout>
        </n-layout>
        <setting />
        <install />
      </n-message-provider>
    </n-notification-provider>
  </n-config-provider>
</template>
