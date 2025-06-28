<template>
  <div>
    <div @click="openFileDialog" @drop.prevent="handleDrop" @dragover.prevent
      class="flex justify-center flex-col text-center  mb-4  p-8   border-dashed border border-[#e0e0e6] hover:border-[#18a058]">
      <div>
        <div class="flex justify-center mb-4">
          <div class="i-ph-upload-simple w-24 h-24"></div>
        </div>
        <n-text style="font-size: 16px">
          点击或者拖动文件到该区域来上传
        </n-text>
        <n-p depth="3" style="margin: 8px 0 0 0">
          请不要上传敏感数据，比如你的银行卡号和密码，信用卡号有效期和安全码
        </n-p>
      </div>

      <input type="file" ref="fileInput" class="hidden" multiple @change="handleFileChange" />
    </div>
    <div v-if="files.length > 0">
      <div class="flex justify-center mt-4 max-sm:flex-col">
        <n-button type="primary" class="m-2" @click="handleUploadAll">上传全部:{{ pendingCount }}</n-button>
        <n-button type="error" class="m-2" @click="handleClear">清空列表</n-button>
        <n-dropdown v-model:value="copyMode" ref="dropdown" trigger="hover" :options="urlType"
          @select="handleCopyAll($event)">
          <n-button class="m-2" type="info" @click="handleCopyAll(copyMode)">复制全部</n-button>
        </n-dropdown>
        <uploadSelection :status="uploadSelectionStatus" @selectedData-update="handleSelectedDataUpdate" />

      </div>
    </div>
    <div class="flex flex-wrap justify-center mt-4">
      <div v-for="file in files" :key="file.file.name" class="flex flex-col m-1 relative">
        <n-card closable @close="handleClose(file)">
          <template #header>
            <n-ellipsis style="max-width: 200px">
              {{ file.file.name }}({{ getFormatFileSize(file.file.size) }})
            </n-ellipsis>
          </template>
          <div v-if="isImage(file)" class="flex justify-center">
            <n-image class="rounded" :src="file.thumbnail" height='180' :preview-src="file.blobURL" />
          </div>
          <div class="flex justify-center my-2" v-if="!isCompleted(file)">
            <n-button class="w-full" tertiary type="primary" @click="handleUpload(file)">上传此图</n-button>
          </div>
          <div v-if="file.result" class="flex items-center flex-col">
            <div class="w-full my-2">
              <n-dropdown v-model:value="copyMode" ref="dropdown" trigger="hover" :options="urlType"
                @select="handleCopy($event, file.result)">
                <n-button class=" w-full" type="info" @click="handleCopy(copyMode, file.result)">
                  复制
                </n-button>
              </n-dropdown>
            </div>
            <n-popover trigger="hover">
              <template #trigger>
                <n-button strong secondary circle class="i-ph-link ml-1 w-6 h-6">
                </n-button>
              </template>
              <div v-for="(result, key) in file.result" :key="key">
                <span style="font-size: 14px">{{ generateLink(copyMode, result.url, result.name) }}</span>
                <n-button class="mx-2 my-1" size="tiny" tertiary @click="handleCopy(copyMode, { result })">复制</n-button>
              </div>
            </n-popover>
          </div>
          <div class="my-2" v-for="selectedData in selectedUploadData" :key="selectedData.id">
            <div class="  rounded-full" v-if="selectedData.id">
              <div class="flex flex-row justify-between">
                <div class="w-[224px] text-[12px] overflow-hidden whitespace-nowrap text-ellipsis">{{
                  getSelectedDataName(selectedData.id) }}</div>
                <n-text type="secondary" style="font-size: 12px">
                  {{ file.status[selectedData.id] }}
                </n-text>
              </div>
              <n-progress v-if="file.progress[selectedData.id] < 100" :percentage="file.progress[selectedData.id]" />

            </div>

          </div>
        </n-card>
      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
import HttpRequest from '@/utils/httpRequest';
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import { generateUniqueId } from '@/utils/generate';
import { useIndexedDB } from '@/stores/useIndexedDB';
import { ref, onMounted, computed } from 'vue';
import { useSelectedUploadConfig } from '@/stores/common';
import { useLocalStorage } from '@/stores/useLocalStorage';
import { uploadSuccess, getUploadTypes } from '@/utils/uploadConfig';
import { generateThumbnail, generateBase64, } from '@/utils/generate';
import { getFormatFileSize, urlType, copyText, generateLink, } from '@/utils/main';


import type { AxiosError, AxiosProgressEvent, AxiosRequestConfig } from 'axios';
import type { UploadFileType, UploadSuccessInfoType, UploadFileStatusType, UploadFileProgressType, ConfigResponse, ProgramConfigurationType } from '@/type';
const message = useMessage()
const fileInput = ref<HTMLInputElement>();
const files = ref<UploadFileType[]>([]);
const copyMode = ref("URL") //  默认复制格式
const uploadSelectionStatus = ref<string>('') // 上传配置选择状态
const selectedUploadData = ref<ConfigResponse[]>([]) // 选中的上传配置


const BedConfigStore = ref<ConfigResponse[]>([]);

const {
  SelectedUploadConfig
} = storeToRefs(useSelectedUploadConfig())
const {
  setSelectedUploadConfig
} = useSelectedUploadConfig();

onMounted(async () => {
  useLocalStorage.get("copyMode").then((mode) => {
    copyMode.value = mode;
  })
  await useSelectedUploadConfig().initialize();
  updateSelectedUploadData(SelectedUploadConfig.value)
});

const openFileDialog = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const isImage = (file: UploadFileType) => {
  return file.file.type.startsWith('image/');
}
const pendingCount = computed(() => {
  let count = 0;
  files.value.forEach(file => {
    selectedUploadData.value.forEach(config => {
      const status = file.status[config.id as string];
      if (status === 'pending' || status === 'failed') {
        count++;
      }
    });
  });
  return count;
});
const handleClear = () => {
  files.value = []
}
const handleClose = (file: UploadFileType) => {
  const index = files.value.indexOf(file);
  if (index > -1) {
    files.value.splice(index, 1);
  }
};
// 点击复制
function handleCopy(mode: string, data: { [key: string]: UploadSuccessInfoType }) {
  const copiedUrls = Object.values(data).map(item => generateLink(mode, item.url, item.name)).join('\n');
  _copy(copiedUrls, mode)
}
// 复制全部
function handleCopyAll(mode: string) {
  const filesResult: UploadSuccessInfoType[] = []
  files.value.map(file => {
    selectedUploadData.value.forEach(config => {
      const result = file.result?.[config.id as string]
      if (result) {
        filesResult.push(result)
      }
    })
  })
  const copiedUrls = filesResult.map(url => generateLink(mode, url.url, url.name)).join('\n');
  _copy(copiedUrls, mode)
}
function _copy(urls: string, mode: string) {
  copyText(urls).then((result) => {
    message[result.type as keyof typeof message](result.message)
  }).catch(() => {
    message.error('复制失败');
  });
  useLocalStorage.set("copyMode", mode).then(() => {
    copyMode.value = mode;
  })
}
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const selectedFiles = input.files as FileList;
  addFiles(selectedFiles);
};
const handleDrop = (event: DragEvent) => {
  const droppedFiles = event.dataTransfer!.files;
  addFiles(droppedFiles);
};


const addFiles = async (newFiles: FileList) => {
  const fileCopies = Array.from(newFiles).map(f => new File([f], f.name, f));
  // 使用顺序处理替代并行处理
  for (const rawFile of fileCopies) {
    const initResult = await _initFile();
    const meta = {
      thumbnail: await generateThumbnail(rawFile),
      base64: await generateBase64(rawFile),
      blobURL: URL.createObjectURL(rawFile)
    };

    // 构造完全独立的对象
    files.value.push({
      id: generateUniqueId().replace(/-/g, ''),
      file: Object.freeze(rawFile), 
      thumbnail: meta.thumbnail as string,
      base64: meta.base64 as string,
      status: { ...initResult.status }, 
      progress: { ...initResult.progress },
      blobURL: meta.blobURL
    });
  }
};

const handleUpload = (file: UploadFileType) => {
  uploadFiles([file]);
}

const handleUploadAll = () => {
  let _files: UploadFileType[] = [];

  files.value.forEach((file: UploadFileType) => {
    const hasFailedOrPendingStatus = selectedUploadData.value.some(config => {
      const fileStatus = file.status[config.id as string]; // 获取当前站点的上传状态
      return fileStatus === 'pending' || fileStatus === 'failed'; // 如果有一个站点是失败或待上传，返回 true
    });
    if (hasFailedOrPendingStatus) {
      _files.push(file);
    }
  });
  uploadFiles(_files);
};
async function uploadFiles(filesToUpload: UploadFileType[]) {
  if (SelectedUploadConfig.value.length < 1) {
    message.error(`请选择上传配置`);
    uploadSelectionStatus.value = 'error';
    setTimeout(() => {
      uploadSelectionStatus.value = '';
    }, 1000);
    return;
  }

  try {
    // 遍历 selectedUploadData.value 中的每个配置
    for (const configData of selectedUploadData.value) {
      const types = await getUploadTypes(configData);
      const Program = configData.data.Program as string;

      const factory = types[Program];
      if (!factory) {
        message.error(`上传方式 ${configData.data.Program} 不存在`);
        continue;
      }
      const config = await factory()
      // 遍历每个文件
      filesToUpload.forEach(async (fileItem) => {
        if (fileItem.status[configData.id as string] == 'completed' || fileItem.status[configData.id as string] == 'uploading') {
          return;
        }
        const id = configData.id as string;
        const file = fileItem.file;
        fileItem.status[id] = 'uploading';
        fileItem.progress[id] = 0;
        if ('upload' in config && typeof config.upload === 'function') {
          try {
            const result = await config.upload(fileItem);
            handleUploadResult(fileItem, configData, { success: true, data: result });
          } catch (error) {
            console.error(error); // Handle any error from the upload
          }
        } else {
          // 使用 axios 上传
          if (!config.formData || !config.url) {
            message.error(`配置缺少 formData 或 url`);
            return;
          }
          const data = config.formData(file);
          try {

            const response = await HttpRequest.post(config.url, data, {
              headers: config.headers,
              programConfiguration: configData.data,
              onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                fileItem.progress[id] = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0;
              },
            } as AxiosRequestConfig);
            if (response.status === 200) {
              fileItem.status[id] = 'completed';
              handleUploadResult(fileItem, configData, { success: true, data: response.data });
            }
          } catch (error) {
            message.error("上传失败:" + file.name);
            fileItem.status[id] = 'failed';
            handleUploadResult(fileItem, configData, { success: false, data: '上传失败', error: error as AxiosError });
          }
        }
      });


    }
  } catch (error) {
    console.log(error);
    message.error("上传失败");
  }
}

const handleUploadResult = async (fileItem: UploadFileType, config: ConfigResponse, result: { success: boolean, data: {}, error?: AxiosError }) => {
  const ProgramConfigurations = config.data;
  if (result.success) {
    uploadSuccess(ProgramConfigurations, fileItem, result.data).then((SuccessResult) => {
      if (!fileItem.result) fileItem.result = {};
      fileItem.result[config.id as string] = SuccessResult;
      message.info(SuccessResult.message)
    })
  } else {
    let errorResult = result.error?.status
    let errorMessage;
    try {
      switch (ProgramConfigurations.Program) {
        case 'Lsky':
          if (errorResult == 401) {
            message.error('未登录或授权失败');
          } else if (errorResult == 403) {
            message.error('管理员关闭了接口功能或没有该接口权限');
          } else if (errorResult == 429) {
            message.error('超出请求配额，请求受限');
          } else if (errorResult == 500) {
            message.error('服务端出现异常');
          } else {
            message.error('请求失败: ' + (result.error?.message || '未知错误'));
          }
          errorMessage = result.error?.message || '未知错误'
          break;
        case 'EasyImages':
          errorMessage = (result as any).message
          break;
        case 'ImgURL':
          errorMessage = (result as any).msg
          break;
        case 'SM_MS':
          errorMessage = (result as any).message
          break;
        case 'Hellohao':
          errorMessage = (result as any).info
          break;
      }
      if (!fileItem.result) fileItem.result = {};
      fileItem.result[config.id as string] = {
        url: errorMessage,
        originalUrl: errorMessage,
        name: fileItem.file.name,
        message: errorMessage
      };

    } catch (error) {
      if (!fileItem.result) fileItem.result = {};
      fileItem.result[config.id as string] = {
        url: "文件" + fileItem.file.name + "上传失败",
        originalUrl: "文件" + fileItem.file.name + "上传失败",
        name: fileItem.file.name,
        message: "上传失败"
      };
    }

  }
};

async function handleSelectedDataUpdate(value: ConfigResponse[]) {
  // 使用 Set 优化查询效率
  const selectedIds = new Set(selectedUploadData.value.map(item => item.id));
  const newOptions = value.filter(item => !selectedIds.has(item.id)).map(item => item.id);

  selectedUploadData.value = value;

  // 提前生成 value 中的 id 集合
  const valueIds = new Set(value.map(item => item.id));

  for (const file of files.value) {
    // 删除不需要的 id
    Object.keys(file.status).forEach(key => {
      if (!valueIds.has(key)) {
        delete file.status[key];
      }
    });
    Object.keys(file.progress).forEach(key => {
      if (!valueIds.has(key)) {
        delete file.progress[key];
      }
    });

    // 添加新选项
    newOptions.forEach(id => {
      if (!file.status[id as string]) {  // 只在没有该 id 时更新
        file.status[id as string] = 'pending';
        file.progress[id as string] = 0;
      }
    });
  }
}


async function updateSelectedUploadData(options: string[]) {
  if (!options) { return; }
  BedConfigStore.value = await useIndexedDB.BedConfigStore.getAllSortedByIndex()
  // 选中的上传配置
  selectedUploadData.value = BedConfigStore.value.filter(item => options.includes(item.id as string))
}

// 初始化文件
async function _initFile() {
  const status: UploadFileStatusType = {}
  const progress: UploadFileProgressType = {}
  for (const configData of selectedUploadData.value) {
    status[configData.id as string] = 'pending'
    progress[configData.id as string] = 0
  }
  return { status, progress }
}

// 根据传来的id,查询selectedUploadData中id相等的并返回ConfigName
function getSelectedDataName(id: string): string {
  return selectedUploadData.value.find(item => item.id == id)?.ConfigName as string
}
// 传入file对象,查file对象内的status对象状态是不是都是"completed"
function isCompleted(file: UploadFileType): boolean {
  return Object.values(file.status).every(status => status === 'completed')
}


</script>