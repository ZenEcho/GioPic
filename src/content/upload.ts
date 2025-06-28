import HttpRequest from '@/utils/httpRequest';
import { useIndexedDB } from '@/stores/useIndexedDB';
import { uploadSuccess, getUploadTypes } from '@/utils/uploadConfig';
import type { AxiosError, AxiosProgressEvent, AxiosRequestConfig } from 'axios';
import { useMessage } from 'naive-ui'
import type { UploadSuccessInfoType, UploadFileType, UploadFileStatusType, UploadFileProgressType, ConfigResponse, ProgramConfigurationType, backgroundSendFileType } from '@/type';

// 定义类型
interface UploadFileResultInfoType {
    uploadConfigID: string[],
    status: UploadFileStatusType,
    url?: string,
    originalUrl?: string,
    name: string,
    message: string,
}

chrome.runtime.onMessage.addListener(async function (request) {
    if (request.readFileInfo) {

        const fileInfo = request.readFileInfo;
        // 验证文件数据
        if (!fileInfo.file || !Array.isArray(fileInfo.file) || fileInfo.file.length === 0) {
            console.error('文件数据无效:', {
                hasFile: !!fileInfo.file,
                isArray: Array.isArray(fileInfo.file),
                length: fileInfo.file?.length
            });
            return false;
        }
        try {
            // 从普通数组重新创建 Uint8Array
            const uint8Array = new Uint8Array(fileInfo.file);
            const file = new File([uint8Array], fileInfo.name, {
                type: fileInfo.type,
                lastModified: fileInfo.lastModified,
            });
            if (file.size === 0) {
                console.error('上传的文件大小为0');
                return false;
            }
            const initResult = await _initFile(fileInfo.uploadConfig);
            const uploadPayload: backgroundSendFileType = {
                name: fileInfo.name,
                type: fileInfo.type,
                uploadConfig: fileInfo.uploadConfig,
                file: file,
                status: { ...initResult.status },
                progress: { ...initResult.progress },
            }
            // 启用文件上传
            console.log('开始上传文件:', uploadPayload);
            
            uploadFiles(uploadPayload);
            return true;
        } catch (error) {
            console.error('处理文件数据时出错:', error);
            return false;
        }

    }
});

const uploadFiles = async (uploadPayload: backgroundSendFileType) => {
    try {
        // 遍历 selectedUploadData 中的每个配置
        message('warning', {
            uploadConfigID: uploadPayload.uploadConfig.map((item) => item.id) as string[],
            name: uploadPayload.name as string,
            status: uploadPayload.status,
            message: '文件:' + uploadPayload.name + ',上传中...'
        })
        for (const configData of uploadPayload.uploadConfig) {
            const id = configData.id as string;
            const Program = configData.data.Program as string;

            const types = await getUploadTypes(configData);
            const factory = types[Program];
            if (!factory) {
                message('error', {
                    uploadConfigID: [id],
                    name: uploadPayload.name as string,
                    status: uploadPayload.status,
                    message: `上传方式 ${configData.data.Program} 不存在`
                })
                continue;
            }
            const config = await factory()
            const file = uploadPayload.file as File;
            uploadPayload.status[id] = 'uploading';
            uploadPayload.progress[id] = 0;
            if ('upload' in config && typeof config.upload === 'function') {
                try {
                    const UploadFile = {
                        file: file,
                        status: { [id]: uploadPayload.status[id] },
                        progress: { [id]: uploadPayload.progress[id] },
                    } as UploadFileType;
                    const result = await config.upload(UploadFile);
                    handleUploadResult(uploadPayload, configData, { success: true, data: result });
                } catch (error) {
                    console.error(error); // Handle any error from the upload
                }
            } else {
                if (!config.formData || !config.url) {
                    // message.error(`配置缺少 formData 或 url`);
                    return;
                }
                const data = config.formData(file);
                try {

                    const response = await HttpRequest.post(config.url, data, {
                        headers: config.headers,
                        programConfiguration: configData.data,
                        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                            uploadPayload.progress[id] = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0;
                        },
                    } as AxiosRequestConfig);
                    if (response.status === 200) {
                        uploadPayload.status[id] = 'completed';
                        handleUploadResult(uploadPayload, configData, { success: true, data: response.data });
                    }
                } catch (error) {

                    uploadPayload.status[id] = 'failed';
                    handleUploadResult(uploadPayload, configData, { success: false, data: '上传失败', error: error as AxiosError });
                }
            }


        }
    } catch (error) {
        console.log(error);
        // message.error("上传失败");
    }
}



const handleUploadResult = async (uploadPayload: backgroundSendFileType, config: ConfigResponse, result: { success: boolean, data: {}, error?: AxiosError }) => {
    const ProgramConfigurations = config.data;
    if (result.success) {
        uploadSuccess(ProgramConfigurations, uploadPayload, result.data).then((SuccessResult: {
            url: string,
            originalUrl: string,
            name: string,
            message: string,
        }) => {
            if (!uploadPayload.result) uploadPayload.result = {};
            uploadPayload.result[config.id as string] = SuccessResult;
            message('success', {
                uploadConfigID: [config.id as string],
                status: uploadPayload.status,
                url: SuccessResult.url,
                originalUrl: SuccessResult.originalUrl,
                name: SuccessResult.name,
                message: SuccessResult.message,
            })
        })
    } else {
        let errorResult = result.error?.status
        let errorMessage;
        try {
            switch (ProgramConfigurations.Program) {
                case 'Lsky':
                    if (errorResult == 401) {
                        message('error', '请检查配置是否正确')
                    } else if (errorResult == 403) {
                        message('error', '管理员关闭了接口功能或没有该接口权限')
                    } else if (errorResult == 429) {
                        message('error', '超出请求配额，请求受限')
                    } else if (errorResult == 500) {
                        message('error', '服务端出现异常')
                    } else {
                        message('error', '请求失败:' + result.error)
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
            if (!uploadPayload.result) uploadPayload.result = {};
            uploadPayload.result[config.id as string] = {
                url: errorMessage,
                originalUrl: errorMessage,
                name: (uploadPayload.file as File).name,
                message: errorMessage
            };

        } catch (error) {
            if (!uploadPayload.result) uploadPayload.result = {};
            uploadPayload.result[config.id as string] = {
                url: "文件" + (uploadPayload.file as File).name + "上传失败",
                originalUrl: "文件" + (uploadPayload.file as File).name + "上传失败",
                name: (uploadPayload.file as File).name,
                message: "上传失败"
            };
        }

    }
};

// 初始化文件状态
async function _initFile(configs: ConfigResponse[]) {
    const status: UploadFileStatusType = {}
    const progress: UploadFileProgressType = {}
    for (const config of configs) {
        status[config.id as string] = 'pending'
        progress[config.id as string] = 0
    }
    return { status, progress }
}


function message(type: string, message: UploadFileResultInfoType | string) {
    // createNotification({
    //     type: 'warning', 
    //     title: '上传状态:',
    //     content: '信息', 
    //     duration: 0,  
    //     uploadData: {
    //         url: 'https://www.google.com/1',
    //         originalUrl: 'https://www.google.com/2',
    //         name: '文件名',
    //         message: '信息2',
    //         status: 'completed'
    //     },
    //     saved: false, 
    // });

    const data: {
        type: string;
        title: string;
        content: string;
        duration: number;
        saved: boolean;
        uploadData?: UploadFileResultInfoType;
    } = {
        type: type,  // 默认类型为信息通知
        title: '上传状态:', // 默认标题为通知
        content: typeof message === 'object' ? message.message : message,   // 默认内容为空
        duration: type == "success" ? 15000 : 5000,   // 默认持续时间为10秒
        saved: type == "success" ? true : false,
    }
    if (typeof message == 'object') {
        data.uploadData = message;
    }
    chrome.runtime.sendMessage({
        notification: {
            injectPage: data
        },

    });
}