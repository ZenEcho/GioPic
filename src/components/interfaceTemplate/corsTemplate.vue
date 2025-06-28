<template>
  <n-card :title="`${program === 'Tencent_COS' ? '腾讯云' : program === 'AWS_S3' ? '亚马逊' : '阿里云'} CORS 设置`" class="my-4">
    <n-form ref="formRef" :model="corsForm" :rules="rules" label-placement="left">
      <n-form-item label="允许来源" path="allowedOrigins">
        <n-input v-model:value="corsForm.allowedOrigins" placeholder="请输入允许的源（多个用逗号分隔）" />
      </n-form-item>

      <n-form-item label="允许方法" path="allowedMethods">
        <n-select v-model:value="corsForm.allowedMethods" multiple :options="httpMethodsOptions" />
      </n-form-item>

      <n-form-item label="允许头部" path="allowedHeaders">
        <n-input v-model:value="corsForm.allowedHeaders" placeholder="请输入允许的请求头部（多个用逗号分隔）" />
      </n-form-item>

      <n-form-item label="暴露头部" path="exposeHeaders">
        <n-input v-model:value="corsForm.exposeHeaders" placeholder="请输入需要暴露的响应头部（多个用逗号分隔）" />
      </n-form-item>

      <n-form-item label="缓存时间" path="maxAge">
        <n-input-number v-model:value="corsForm.maxAge" placeholder="请输入预检请求的缓存时间（秒）" :min="0" />
      </n-form-item>

      <n-space justify="end">
        <whatisCORS>
          <n-button type="info">CORS 是什么?</n-button>
        </whatisCORS>
        <n-button type="primary" @click="handleSubmit">推送到云</n-button>
        <n-button @click="handleGet">获取云配</n-button>
        <n-button @click="handleReset">重置</n-button>
      </n-space>
    </n-form>
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { COS_Client, OSS_Client, S3_Client } from '@/utils/authObjStorage'
import { useLocalStorage } from '@/stores/useLocalStorage'
import { GetBucketCorsCommand, PutBucketCorsCommand } from "@aws-sdk/client-s3"
import type { ConfigResponse, ProgramConfigurationType } from '@/type'
import type COS from 'cos-js-sdk-v5'
import type OSS from 'ali-oss'
import type { S3Client } from "@aws-sdk/client-s3"

// 新增：统一默认的 CORS 表单数据
const DEFAULT_CORS_FORM = {
  allowedOrigins: '*',
  allowedMethods: ['GET', 'POST'],
  allowedHeaders: '*',
  exposeHeaders: 'ETag,Content-Length,Content-Type,Content-Disposition',
  maxAge: 600
}

interface CorsFormData {
  allowedOrigins: string;
  allowedMethods: string[];
  allowedHeaders: string;
  exposeHeaders: string;
  maxAge: number;
}

interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposeHeaders: string[];
  maxAge: number;
}

const message = useMessage()
const formRef = ref<FormInst | null>(null)
const ProgramConfig = ref<ConfigResponse>({ data: {} as ProgramConfigurationType })

const props = defineProps<{
  program: string
}>()

// 使用默认表单数据初始化
const corsForm = ref<CorsFormData>({ ...DEFAULT_CORS_FORM })

// 校验规则
const rules: FormRules = {
  allowedOrigins: {
    required: true,
    message: '请输入允许的源',
    trigger: 'blur'
  },
  allowedMethods: {
    validator: (rule: any, value: string[]) => {
      return value && value.length > 0 ? true : new Error('请至少选择一种允许的方法')
    },
    trigger: 'change'
  },
  allowedHeaders: {
    required: true,
    message: '请输入允许的请求头部',
    trigger: 'blur'
  },
  maxAge: {
    type: 'number',
    min: 0,
    message: '缓存时间必须大于等于0',
    trigger: 'change'
  }
}

const httpMethodsOptions = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'].map(v => ({
  label: v,
  value: v
}))

// 获取云端 CORS 配置
const handleGet = async () => {
  await updateProgramConfig()
  try {
    let corsRules: any;
    console.log(props.program);

    if (props.program === 'Tencent_COS') {
      const _Client = await COS_Client(ProgramConfig.value) as COS
      const result = await _Client.getBucketCors({
        Bucket: ProgramConfig.value.data.Bucket as string,
        Region: ProgramConfig.value.data.Region as string,
      });
      corsRules = result.CORSRules?.[0] || {};
      console.log(result);
      corsForm.value = {
        allowedOrigins: corsRules.AllowedOrigins?.join(',') || DEFAULT_CORS_FORM.allowedOrigins,
        allowedMethods: corsRules.AllowedMethods || DEFAULT_CORS_FORM.allowedMethods,
        allowedHeaders: corsRules.AllowedHeaders?.join(',') || DEFAULT_CORS_FORM.allowedHeaders,
        exposeHeaders: corsRules.ExposeHeaders?.join(',') || DEFAULT_CORS_FORM.exposeHeaders,
        maxAge: Number(corsRules.MaxAgeSeconds) || DEFAULT_CORS_FORM.maxAge
      };
    } else if (props.program === 'Aliyun_OSS') {
      const _Client = await OSS_Client(ProgramConfig.value) as OSS
      const result = await _Client.getBucketCORS(ProgramConfig.value.data.Bucket as string);
      corsRules = result.rules?.[0] || {};
      corsForm.value = {
        allowedOrigins: corsRules.allowedOrigin || DEFAULT_CORS_FORM.allowedOrigins,
        allowedMethods: corsRules.allowedMethod || DEFAULT_CORS_FORM.allowedMethods,
        allowedHeaders: corsRules.allowedHeader || DEFAULT_CORS_FORM.allowedHeaders,
        exposeHeaders: corsRules.exposeHeader?.join(',') || DEFAULT_CORS_FORM.exposeHeaders,
        maxAge: Number(corsRules.maxAgeSeconds) || DEFAULT_CORS_FORM.maxAge
      };
    } else if (props.program === 'AWS_S3') {
      const _Client = await S3_Client(ProgramConfig.value) as S3Client
      const command = new GetBucketCorsCommand({ Bucket: ProgramConfig.value.data.Bucket as string });
      const result = await _Client.send(command);
      console.log(result);

      corsRules = result.CORSRules?.[0] || {};
      corsForm.value = {
        allowedOrigins: corsRules.AllowedOrigins?.join(',') || DEFAULT_CORS_FORM.allowedOrigins,
        allowedMethods: corsRules.AllowedMethods || DEFAULT_CORS_FORM.allowedMethods,
        allowedHeaders: corsRules.AllowedHeaders?.join(',') || DEFAULT_CORS_FORM.allowedHeaders,
        exposeHeaders: corsRules.ExposeHeaders?.join(',') || DEFAULT_CORS_FORM.exposeHeaders,
        maxAge: corsRules.MaxAgeSeconds || DEFAULT_CORS_FORM.maxAge
      };
    }


    message.success('获取 CORS 配置成功');
  } catch (error: any) {
    console.error('获取 CORS 配置失败:', error);
    message.error('获取 CORS 配置失败: ' + (error.message || error));
  }
};

// 提交 CORS 配置
const handleSubmit = async () => {
  await updateProgramConfig()
  try {
    await formRef.value?.validate();
    const corsConfig: CorsConfig = {
      allowedOrigins: corsForm.value.allowedOrigins.split(',').map(item => item.trim()),
      allowedMethods: corsForm.value.allowedMethods,
      allowedHeaders: corsForm.value.allowedHeaders.split(',').map(item => item.trim()),
      exposeHeaders: corsForm.value.exposeHeaders.split(',').map(item => item.trim()),
      maxAge: corsForm.value.maxAge
    };

    if (props.program === 'Tencent_COS') {
      const _Client = await COS_Client(ProgramConfig.value) as COS
      _Client.putBucketCors({
        Bucket: ProgramConfig.value.data.Bucket as string,
        Region: ProgramConfig.value.data.Region as string,
        CORSRules: [{
          AllowedOrigin: corsConfig.allowedOrigins,
          AllowedMethod: corsConfig.allowedMethods,
          AllowedHeader: corsConfig.allowedHeaders,
          ExposeHeader: corsConfig.exposeHeaders,
          MaxAgeSeconds: corsConfig.maxAge
        }]
      });
    } else if (props.program === 'Aliyun_OSS') {
      const _Client = await OSS_Client(ProgramConfig.value) as OSS
      _Client.putBucketCORS(ProgramConfig.value.data.Bucket as string, [{
        allowedOrigin: corsConfig.allowedOrigins,
        allowedMethod: corsConfig.allowedMethods,
        allowedHeader: corsConfig.allowedHeaders,
        exposeHeader: corsConfig.exposeHeaders,
        maxAgeSeconds: String(corsConfig.maxAge)
      }]);
    } else if (props.program === 'AWS_S3') {
      const _Client = await S3_Client(ProgramConfig.value) as S3Client
      const input = {
        Bucket: ProgramConfig.value.data.Bucket as string,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: corsConfig.allowedOrigins,
              AllowedMethods: corsConfig.allowedMethods,
              AllowedHeaders: corsConfig.allowedHeaders,
              ExposeHeaders: corsConfig.exposeHeaders,
              MaxAgeSeconds: corsConfig.maxAge
            },
          ],
        },
      };
      const command = new PutBucketCorsCommand(input);
      _Client.send(command);
    }
    message.success('CORS 配置已更新');
  } catch (error: any) {
    console.error('更新 CORS 配置失败:', error);
    message.error('更新 CORS 配置失败: ' + (error.message || error));
  }
};

// 重置处理，改为复用 DEFAULT_CORS_FORM
const handleReset = () => {
  corsForm.value = { ...DEFAULT_CORS_FORM }
}

async function updateProgramConfig() {
  const ProgramConfiguration = await useLocalStorage.get("ProgramConfiguration")
  ProgramConfig.value = {
    data: ProgramConfiguration
  }
}

onMounted(() => {
  handleGet()
  window.addEventListener('readApplicationMenu', handleGet); // 刷新菜单的时候，请求 CORS 配置
})
</script>