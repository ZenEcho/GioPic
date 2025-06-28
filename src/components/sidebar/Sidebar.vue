<template>
    <div class="shadow top-0 border-r sticky overflow-auto h-full ">
        <n-card>
            <a href="" class="flex flex-col items-center justify-center my-4 border-t-0 border-l-0 border-r-0">
                <img src="@/assets/icons/logo128.png" alt="logo" class="border rounded-2xl bg-slate-300 "
                    :class="SidebarCollapsed ? 'h-10' : 'h-16'" />
            </a>
            <n-gradient-text type="info" class="w-full overflow-hidden text-2xl text-center">
                {{ SidebarCollapsed ? '' : $t('GioPic') }}
            </n-gradient-text>
        </n-card>
        <Menu></Menu>
        <n-card content-style="padding:0px;">
            <div class="pt-4 pb-8"
                :class="SidebarCollapsed ? 'flex flex-col items-center' : 'flex flex-row justify-center'">
                <n-dropdown :options="options" @select="switchLanguage">
                    <n-button quaternary :title="$t('language')" class="h-6 " :class="SidebarCollapsed ? 'my-4' : ''"
                        style="direction: rtl; unicode-bidi: bidi-override;">{{ $t('language') }}
                    </n-button>
                </n-dropdown>
                <n-button :title="$t('dark mode')" type="primary" class="w-6 h-6"
                    :class="DarkMode ? 'i-ph-sun mx-1' : 'i-ph-moon'"
                    @click="setDarkMode(!DarkMode)">
                </n-button>
                <n-button :title="$t('Extension Settings')" @click="setSettingSwitchStatus(true)" type="primary"
                    class="i-ph-gear w-6 h-6"
                    :class="SidebarCollapsed ? 'my-4' : 'mx-1'">
                </n-button>

            </div>
        </n-card>
        <div class="my-4 flex items-center text-[14px]"
            :class="SidebarCollapsed ? 'flex-col ' : 'flex-row justify-center'">
            <!-- 桌面端在线情况 -->
            <span v-show="!SidebarCollapsed">桌面端：</span>
            <a :href="isOnline ? '' : 'https://github.com/isYangs/GioPic'" :target="isOnline ? '_self' : '_blank'"
                class=" m-0 p-0 w-4 h-4"><n-button :type="isOnline ? 'primary' : 'error'" class="w-4 h-4"
                    circle></n-button> </a>

        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDesktopAppSocket, useAppSettings } from '@/stores/appSettings';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useLocalStorage } from '@/stores/useLocalStorage';

const { isOnline } = storeToRefs(useDesktopAppSocket());
const { locale } = useI18n(); // locale 现在是 Ref 类型
const { setDarkMode, setSettingSwitchStatus } = useAppSettings()
const {
    DarkMode,
    SidebarCollapsed,
    SettingSwitchStatus
} = storeToRefs(useAppSettings())

const options = ref([
    { label: '中文', key: 'zh-CN' },
    { label: 'English', key: 'en-US' },
    { label: '日本語', key: 'ja-JP' },

]);
function switchLanguage(key: string): void {
    locale.value = key; // 正确使用 .value 赋值

    useLocalStorage.get("uploadFunctionSettings").then((result) => {
        if (result) {
            result.i18n = key;
            useLocalStorage.set('uploadFunctionSettings', result);
        }
    });

    // todo根据不同语言设置文字方向...
}

onMounted(() => {
    // const message = {
    //     type: 'message',
    //     data: {
    //         action: 'getUser',
    //         userId: 123
    //     }
    // }

    // desktopApp.sendMessage(message, (response) => {
    //     console.log('收到响应:', response)
    // })
});

</script>
<style scoped>
.active-menu {
    color: #42b983;
}

.selected-menu {
    background-color: #e0f7fa;
    color: #00796b;
}

/* 滚动条太宽了窄一点 */
::-webkit-scrollbar {
    width: 0px;
}
</style>