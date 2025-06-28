<template>
    <n-form :model="formValue" ref="formRef" :rules="rules">
        <!-- 接口版本选择V1和V2 -->
        <n-form-item label="接口版本" path="version">
            <n-select v-model:value="formValue.version" :options="versionOptions" placeholder="请选择接口版本" />
        </n-form-item>

        <n-form-item label="网站域名" path="Host">
            <n-input v-model:value="formValue.Host" placeholder="请输入网站域名" />
            <n-checkbox title="[仅上传生效]使用完整请求地址,不在由扩展拼接" v-model:checked="formValue.fullURL" class="w-[110px] ml-1">
                完整地址
            </n-checkbox>
        </n-form-item>
        <n-form-item label="Token" path="Token">
            <n-input v-model:value="formValue.Token" placeholder="请输入Token" />

            <n-button v-if="formValue.version == 2" type="info" class="i-ph-user h-5" title="获取token"
                @click="showModal = true"></n-button>
        </n-form-item>
        <n-form-item label="隐私选择" path="Privacy">
            <n-select v-model:value="formValue.Privacy" :options="privacyOptions" placeholder="请选择隐私设置" />
        </n-form-item>
        <n-form-item label="相册选择" path="Album">
            <n-select v-model:value="formValue.Album" :options="albumOptions" placeholder="请选择相册"
                :loading="loading.albumLoading" />
            <!-- 刷新按钮 -->
            <n-button @click="getAlbums" type="info" class="i-ph-repeat"> </n-button>
        </n-form-item>
        <n-form-item path="Storage" :label="storageOptionsError ? '输入存储ID' : '存储源选择'">
            <n-select v-if="!storageOptionsError" v-model:value="formValue.Storage" :options="storageOptions"
                placeholder="请选择存储源" :loading="loading.storageLoading" />
            <n-input v-else v-model:value="formValue.Storage" placeholder="请输入存储ID" />
            <!-- 刷新按钮 -->
            <n-button @click="getStorage" type="info" class="i-ph-repeat"> </n-button>
        </n-form-item>
        <n-form-item>
            <n-button type="primary" @click="handleSubmit">提交</n-button>
        </n-form-item>
    </n-form>

    <n-modal v-model:show="showModal" preset="dialog" title="Dialog">
        <template #header>
            <div>获取Token</div>
        </template>
        <n-alert type="warning" :show-icon="false" class="mb-4">
            登录请求的URL为：{{ formValue.fullURL ? formValue.Host : "https://" + formValue.Host + "/api/v2/login" }}
        </n-alert>
        <n-form-item label="登录类型" path="login_type">
            <n-select v-model:value="formValue.login_type" :options="login_typeOptions" placeholder="请选择登录类型" />
        </n-form-item>
        <n-form-item label="账号" path="username">
            <n-input v-model:value="formValue.username" :placeholder="getPlaceholderText" clearable />
        </n-form-item>

        <n-form-item label="密码" path="password">
            <n-input v-model:value="formValue.password" type="password" placeholder="请输入密码" show-password-on="click"
                clearable />
        </n-form-item>

        <n-checkbox v-model:checked="formValue.remember" label="记住账号信息(谨慎)">
        </n-checkbox>
        <n-alert type="info" :show-icon="false" class="mt-4">
            获取Token后会自动填入上方Token输入框中
        </n-alert>
        <template #action>
            <n-button type="primary" @click="login">获取</n-button>
        </template>
    </n-modal>
</template>

<script setup lang="ts">

import { ref, watch, onMounted, computed } from 'vue';
import { useMessage } from 'naive-ui';
import type { FormValidationError, FormInst } from 'naive-ui';
const message = useMessage();
import api from '@/utils/httpRequest';
const showModal = ref(false)
const formRef = ref<FormInst | null>(null)
const loading = ref({
    albumLoading: false,
    storageLoading: false,
})

const formValue = ref({
    Host: '',
    Token: '',
    Album: "",
    Privacy: 0,
    Storage: "",
    version: 1,
    login_type: 'email',
    username: '',
    password: '',
    remember: false,
    fullURL: false
})
const rules = {
    Host: [
        { required: true, message: '请输入网站域名', trigger: 'blur' }
    ],
    Token: [
        { required: true, message: '请输入Token', trigger: 'blur' }
    ]
}


const albumOptions = ref([{ value: "", label: "默认" }])
const storageOptions = ref([{ value: "", label: "默认" }])

const versionOptions = [{ label: 'V1', value: 1 }, { label: 'V2', value: 2 }]
const privacyOptions = [
    { label: '公开', value: 1 },
    { label: '私有', value: 0 },
]
const login_typeOptions = [
    { label: '邮箱', value: 'email' },
    { label: '手机号码', value: 'phone' },
    { label: '用户名', value: 'username' },
]

const emit = defineEmits(['submit'])

function handleSubmit() {
    if (formRef.value) {
        //    如果没选择记住账号，就删除消息
        if (!formValue.value.remember) {
            formValue.value.username = '';
            formValue.value.password = '';
        }
        formRef.value.validate((errors: Array<FormValidationError> | undefined) => {
            if (!errors) {
                emit('submit', formValue.value)
                message.success('提交成功');
            }
            else {
                message.error('请检查表单填写是否正确');
            }
        })
    } else {
        message.error('表单引用不存在');
    }
}
const getPlaceholderText = computed(() => {
    const typeMap = {
        'email': '请输入邮箱地址',
        'phone': '请输入手机号码',
        'username': '请输入用户名'
    };
    return typeMap[formValue.value.login_type as keyof typeof typeMap] || '请输入账号';
});
// 获取远程相册
const getAlbums = async () => {
    loading.value.albumLoading = true;
    // 远程请求
    const v1 = formValue.value.fullURL ? formValue.value.Host : "https://" + formValue.value.Host + "/api/v1/albums"
    const v2 = formValue.value.fullURL ? formValue.value.Host : "https://" + formValue.value.Host + "/api/v2/user/albums"
    const url = formValue.value.version === 1 ? v1 : v2;
    api.get(url as string, {
        headers: {
            'Accept': 'application/json',
            'Authorization': formValue.value.Token
        },
    }).then(res => {
        if (res.data) {
            if (formValue.value.version == 1) {
                albumOptions.value = res.data.data.data.map((item: { name: string; id: string | number }) => {
                    return {
                        label: item.name,
                        value: item.id
                    }
                })
                albumOptions.value.unshift({ value: "", label: "默认" });
            } else {
                albumOptions.value = res.data.data.data.map((item: { name: string; id: string | number }) => {
                    return {
                        label: item.name,
                        value: item.id
                    }
                })
                albumOptions.value.unshift({ value: "", label: "默认" });
            }

        } else {
            albumOptions.value = [{
                value: "",
                label: "默认(请求成功但加载失败)"
            }];
        }
    }).catch(err => {
        console.log(err);
        albumOptions.value = [{
            value: "",
            label: "默认(请求失败)"
        }];
    }).finally(() => {
        loading.value.albumLoading = false;
    })
}

const storageOptionsError = ref(false)
//获取远程存储源
const getStorage = async () => {
    loading.value.storageLoading = true;
    // 远程请求
    const v1 = formValue.value.fullURL ? formValue.value.Host : "https://" + formValue.value.Host + "/api/v1/storages";
    const v2 = formValue.value.fullURL ? formValue.value.Host : "https://" + formValue.value.Host + "/api/v2/group";
    const url = formValue.value.version === 1 ? v1 : v2;
    api.get(url as string, {
        headers: {
            'Accept': 'application/json',
            'Authorization': formValue.value.Token
        }
    }).then(res => {
        if (res.data) {
            if (formValue.value.version == 1) {
                storageOptions.value = res.data.data.strategies.map((item: { name: string; id: string | number }) => {
                    return {
                        label: item.name,
                        value: item.id
                    }
                })
                formValue.value.Storage = formValue.value.Storage || (storageOptions.value.length > 0 ? storageOptions.value[0].value : "");
                storageOptionsError.value = false
            } else {
                storageOptions.value = res.data.data.storages.map((item: { name: string; id: string | number }) => {
                    return {
                        label: item.name,
                        value: item.id
                    }
                })
                formValue.value.Storage = formValue.value.Storage || (storageOptions.value.length > 0 ? storageOptions.value[0].value : "");
                storageOptionsError.value = false
            }
        } else {
            storageOptionsError.value = true
            storageOptions.value = [{
                value: "",
                label: "默认(请求成功但加载失败)",
            }];
        }
    }).catch(err => {
        console.log(err);
        storageOptionsError.value = true
        storageOptions.value = [{
            value: "",
            label: "默认(请求失败)",
        }];
    }).finally(() => {
        loading.value.storageLoading = false;
    })
}

//登录
const login = async () => {
    const url = formValue.value.fullURL ? formValue.value.Host : "https://" + formValue.value.Host + "/api/v2/login";
    api.post(url as string, {
        login_type: formValue.value.login_type,
        username: formValue.value.username,
        password: formValue.value.password,
        remember: formValue.value.remember
    }).then(res => {
        if (res.data && res.data.data && res.data.data.token) {
            formValue.value.Token = 'Bearer ' + res.data.data.token;
            message.success('登录成功，Token已填入');
            showModal.value = false;
        } else {
            message.error('登录失败，请检查账号信息');
        }
    }).catch(err => {
        console.error(err);
        message.error('登录请求失败，请检查网络或服务器状态');
    });
}


const props = defineProps(['initialFormValue']);

watch(() => props.initialFormValue, (newVal) => {
    if (newVal) {
        if (typeof newVal === 'string') {
            try {
                newVal = JSON.parse(newVal);
            } catch (e) {
                console.error("initialFormValue不是有效的JSON字符串", e);
                return;
            }
        }
        // 过滤新数据，只保留 formValue 中已有的字段
        const filteredNewVal = Object.keys(formValue.value).reduce<Record<string, any>>((acc, key) => {
            if (newVal.hasOwnProperty(key)) {
                acc[key] = newVal[key];
            }
            return acc;
        }, {});
        if (filteredNewVal.hasOwnProperty('Privacy')) {
            filteredNewVal.Privacy = Number(filteredNewVal.Privacy);
        }
        if (filteredNewVal.hasOwnProperty('Token') && filteredNewVal.Token && !filteredNewVal.Token.startsWith('Bearer ')) {
            filteredNewVal.Token = 'Bearer ' + filteredNewVal.Token;
        }
        Object.assign(formValue.value, filteredNewVal);
    }
}, { immediate: true });


// 所有东西加载完毕后
onMounted(() => {
    // 等待500毫秒
    setTimeout(() => {
        if (formValue.value.Host && formValue.value.Token) {
            getAlbums();
            getStorage();
        }
    }, 300);
})
</script>
