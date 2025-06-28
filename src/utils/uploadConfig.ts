import { uploadRecordsStorage } from '@/stores/useLocalStorage';
import { taskQueue } from '@/utils/TaskQueue';
import { COS_Client, OSS_Client, S3_Client } from '@/utils/authObjStorage';
import HttpRequest from '@/utils/httpRequest';
import { Upload } from '@aws-sdk/lib-storage'
import { generateRandomNumber, generateRandomString, generateBase64 } from '@/utils/generate';

import type COS from 'cos-js-sdk-v5';
import type OSS from 'ali-oss';
import type { AxiosProgressEvent, AxiosRequestConfig } from 'axios';
import type { ProgramConfigurationType, UploadFileType, ConfigResponse, UploadConfigType, BaseUploadConfigType, UploadTypeFactoryType, CustomUploadConfigType, messageType, backgroundSendFileType } from '@/type';
import type { S3Client, ObjectCannedACL } from '@aws-sdk/client-s3'
import type { Progress } from '@aws-sdk/lib-storage'

// ================================================
// 【获取上传类型】
// ================================================
export async function getUploadTypes(ConfigResponse: ConfigResponse): Promise<Record<string, UploadTypeFactoryType>> {
    const config = ConfigResponse.data
    const configID = ConfigResponse.id as string
    const LskyV1Url = config.fullURL ? config.Host : `https://${config.Host}/api/v1/upload`
    const LskyV2Url = config.fullURL ? config.Host : `https://${config.Host}/api/v2/upload`
    const LskyUrl = config.version == 1 ? LskyV1Url : LskyV2Url;
    return {
        Lsky: () => ({
            url: LskyUrl,
            headers: { Authorization: config.Token },
            formData: (file: File) => {
                const formData = new FormData();
                const isV1 = config.version === 1;
                if (config.Storage) {
                    const storageKey = isV1 ? 'strategy_id' : 'storage_id';
                    formData.append(storageKey, config.Storage as string);
                }

                if (config.Album) {
                    const albumKey = isV1 ? 'Album' : 'album_id';
                    formData.append(albumKey, config.Album as string);
                }

                const privacyKey = isV1 ? 'Privacy' : 'is_public';
                formData.append(privacyKey, config.Privacy as string);

                formData.append('file', file);
                return formData;
            }
        }),
        EasyImages: () => ({
            url: config.fullURL
                ? config.Host
                : `https://${config.Host}/api/index.php`,
            formData: (file: File) => {
                const formData = new FormData();
                formData.append('token', config.Token as string);
                formData.append('file', file);
                return formData;
            }
        }),
        ImgURL: () => ({
            url: config.fullURL
                ? config.Host
                : `https://${config.Host}/api/v2/upload`,
            formData: (file: File) => {
                const formData = new FormData();
                formData.append('token', config.Token as string);
                formData.append('uid', config.Uid as string);
                formData.append('file', file);
                return formData;
            }
        }),
        SM_MS: () => ({
            url: config.fullURL
                ? config.Host : `https://${config.Host}/api/v2/upload`,
            headers: { Authorization: config.Token },
            formData: (file: File) => {
                const formData = new FormData();
                formData.append('token', config.Token as string);
                formData.append('smfile', file);
                return formData;
            }
        }),
        Chevereto: () => ({
            url: (() => {
                let Temporary_URL = '';
                if (config.Expiration !== 'NODEL') {
                    Temporary_URL += `&expiration=${config.Expiration}`;
                }
                if (config.Album) {
                    Temporary_URL += `&Album=${config.Album}`;
                }
                if (config.Nsfw) {
                    Temporary_URL += `&nsfw=${config.Nsfw}`;
                }
                return config.fullURL ? config.Host : `https://${config.Host}/api/1/upload/?key=${config.Token}${Temporary_URL}`;
            })(),
            headers: { Authorization: config.Token },
            formData: (file: File) => {
                const formData = new FormData();
                formData.append('source', file);
                return formData;
            }
        }),
        Hellohao: () => ({
            url: config.fullURL ? config.Host : `https://${config.Host}/api/uploadbytoken/`,
            formData: (file: File) => {
                const formData = new FormData();
                formData.append('token', config.Token as string);
                formData.append('source', config.Source as string);
                formData.append('file', file);
                return formData;
            }
        }),
        Imgur: () => ({
            url: config.fullURL ? config.Host : `https://api.imgur.com/3/upload`,
            headers: { "Authorization": 'Client-ID ' + config.Token },
            formData: (file: File) => {
                const formData = new FormData();
                formData.append(config.imgur_mode == 'image' ? "image" : "video", file);
                return formData;
            }
        }),
        Tencent_COS: () => ({
            upload: async function (fileItem) {
                const config = ConfigResponse.data
                const file = fileItem.file;
                if (!config.SecretId || !config.SecretKey) {
                    return Promise.reject(new Error('存储配置不完整,请检查 AccessKey/SecretKey/Bucket 配置'))
                }
                const client = await COS_Client(ConfigResponse) as COS;
                const Path = await getUploadPath(file, config)
                fileItem.uploadPath = Path;
                const filename = Path + file.name;

                return new Promise((resolve, reject) => {
                    try {
                        client.uploadFile({
                            Bucket: config.Bucket as string,
                            Region: config.Region as string,
                            Key: filename,
                            Body: file,
                            onProgress: (progress) => {
                                const percentage = Math.round((progress.loaded / progress.total) * 100);
                                fileItem.progress[configID] = percentage;
                                fileItem.status[configID] = 'uploading';
                            }
                        }).then((data) => {
                            fileItem.status[configID] = 'completed';
                            resolve(data);
                        }).catch((error) => {
                            console.error(error);
                            fileItem.status[configID] = 'failed';
                            reject({ error: error, message: "上传失败" });
                        });
                    } catch (error) {
                        console.error(error);
                        fileItem.status[configID] = 'failed';
                        reject({ error: error, message: "上传失败" });
                    }
                });
            }
        }),
        Aliyun_OSS: () => ({
            upload: async function (fileItem) {
                const config = ConfigResponse.data
                const file = fileItem.file;
                if (!config.SecretId || !config.SecretKey) {
                    return Promise.reject(new Error('存储配置不完整,请检查 AccessKey/SecretKey/Bucket 配置'))
                }
                const client = await OSS_Client(ConfigResponse) as OSS;
                const Path = await getUploadPath(file, config)
                fileItem.uploadPath = Path;
                const filename = Path + file.name;
                return new Promise((resolve, reject) => {
                    try {
                        client.multipartUpload(filename, file, {
                            progress: (progress) => {
                                const percentage = Math.floor(progress * 100);
                                fileItem.progress[configID] = percentage;
                                fileItem.status[configID] = 'uploading';
                            }
                        }).then((data) => {
                            fileItem.status[configID] = 'completed';
                            resolve(data);
                        }).catch((error) => {
                            console.log(error);
                            fileItem.status[configID] = 'failed';
                            reject({ error: error, message: "上传失败" });
                        });

                    } catch (error) {
                        console.log(error);
                        fileItem.status[configID] = 'failed';
                        reject({ error: error, message: "上传失败" });
                    }
                });
            }
        }),
        AWS_S3: () => ({
            upload: async function (fileItem) {
                const config = ConfigResponse.data
                const file = fileItem.file;
                if (!config.SecretId || !config.SecretKey) {
                    return Promise.reject(new Error('存储配置不完整,请检查 AccessKey/SecretKey/Bucket 配置'))
                }

                const client = await S3_Client(ConfigResponse) as S3Client;
                const Path = await getUploadPath(file, config)
                fileItem.uploadPath = Path;
                const filename = Path + file.name;
                try {
                    const upload = new Upload({
                        client,
                        params: {
                            Bucket: config.Bucket,
                            Key: filename,
                            Body: file,
                            ContentType: file.type,
                            ACL: config.ACL as ObjectCannedACL || 'public-read',
                        },
                    })

                    // 监听上传进度
                    upload.on('httpUploadProgress', (progress: Progress) => {
                        const percentage = progress.total ? Math.floor((progress.loaded as number / progress.total) * 100) : 0;
                        fileItem.progress[configID] = percentage;
                        fileItem.status[configID] = 'uploading';
                    });
                    const resp = await upload.done()
                    fileItem.status[configID] = 'completed';
                    return resp
                } catch (error) {
                    fileItem.status[configID] = 'failed';
                    return { error: error, message: "上传失败" };
                }
            }
        }),
        GitHub: () => ({
            upload: async function (fileItem) {
                const file = fileItem.file;
                let data: { message: string; sha?: string; content?: string } = {
                    message: 'UploadDate:' + new Date().toLocaleString()
                };
                const Path = await getUploadPath(file, config) as string
                fileItem.uploadPath = Path;
                const _url = `https://api.github.com/repos/${config.Owner}/${config.Repository}/contents${Path}${file.name}`
                return new Promise((resolve, reject) => {
                    HttpRequest.get(_url, {
                        headers: {
                            'Authorization': `Bearer ${config.Token}`,
                            'Content-Type': 'application/json'
                        },
                        programConfiguration: config
                    })
                        .then(response => {
                            if (response.data.sha) {
                                data.sha = response.data.sha; //有重复文件的话，需要传入sha
                            }
                        })
                        .catch(error => {
                            if (error.response && error.response.status === 404) {
                                console.log("文件无冲突");
                            } else {
                                console.log(error);
                            }
                        })
                        .finally(() => {
                            GitHub_fileUpload();
                        });

                    async function GitHub_fileUpload() {
                        const fileBase64 = await generateBase64(file)
                        const base64String = typeof fileBase64 === 'string' ? fileBase64.split(',')[1] : '';
                        data.content = base64String;
                        HttpRequest.put(_url, JSON.stringify(data), {
                            headers: {
                                'Authorization': 'Bearer ' + config.Token,
                                'Content-Type': 'application/json'
                            },
                            programConfiguration: config,
                            onUploadProgress: function (progressEvent) {
                                const percentCompleted = progressEvent.total ? Math.floor((progressEvent.loaded * 100) / progressEvent.total) : 0;
                                fileItem.progress[configID] = percentCompleted;
                                fileItem.status[configID] = 'uploading';
                            }
                        })
                            .then(res => {
                                fileItem.status[configID] = 'completed';
                                resolve(res.data);
                            })
                            .catch(error => {
                                console.error(error);
                                fileItem.status[configID] = 'failed';
                                reject({ error: error, message: "上传失败" });
                            });
                    }
                })
            }
        }),
        IMGDD: () => ({
            url: `https://imgdd.com/upload`,
            headers: { "Accept": "application/json", "User-Agent": "PLExtension" },
            formData: (file: File) => {
                const formData = new FormData();
                formData.append('image', file);
                return formData;
            }
        }),
        Custom: () => ({
            upload: async function (fileItem) {
                const file = fileItem.file

                // 1. 自定义替换逻辑
                let _url = await custom_Replace(config.Url as string, file, config) as string

                let _headers = Array(config.headers).length > 0
                    ? await custom_ReplaceInObject(config.headers, file, config)
                    : config.headers

                let _params = Array(config.params).length > 0
                    ? await custom_ReplaceInObject(config.params, file, config)
                    : config.params

                let _data = config.bodyType !== 'none'
                    ? await custom_ReplaceInObject(config.body, file, config)
                    : config.body
                // ------------------------
                // 2. 在此处将形如 { "0": { key, value }, "1": { key, value } } 的结构转为 { key1: val1, key2: val2 }
                // ------------------------
                _headers = convertPairsToObject(_headers)
                _params = convertPairsToObject(_params)
                _data = convertPairsToObject(_data)


                // 3. 如果配置了 authType，就往 headers 里塞鉴权头
                if (!_headers) _headers = {}
                switch (config.authType) {
                    case 'basic':
                        if (config.authUsername || config.authPassword) {
                            const base64Creds = btoa(
                                `${config.authUsername}:${config.authPassword}`
                            )
                            _headers['Authorization'] = `Basic ${base64Creds}`
                        }
                        break
                    case 'bearer':
                        if (config.authToken) {
                            _headers['Authorization'] = `Bearer ${config.authToken}`
                        }
                        break
                    case 'apiKey':
                        if (config.authApiKey) {
                            _headers['x-api-key'] = config.authApiKey
                        }
                        break
                    // 不处理 'none' 或其他情况
                }

                // 4. 根据 bodyType 再处理 data
                //    - 如果是 'string' 就序列化
                //    - 如果是 'form-data' 就组装 FormData
                if (config.bodyType === 'string') {
                    _data = JSON.stringify(_data)
                } else if (config.bodyType === 'form-data') {
                    const formData = new FormData()
                    if (_data && typeof _data === 'object') {
                        for (const [key, val] of Object.entries(_data)) {
                            formData.append(key, val as string | Blob)
                        }
                    }
                    _data = formData
                }
                // 5. 组装 axiosConfig
                let axiosConfig: AxiosRequestConfig = {
                    method: config.method,
                    url: _url,
                    headers: _headers,
                    params: _params,
                    data: _data,
                    responseType: config.responseType || 'json',
                    programConfiguration: config,
                    onUploadProgress: function (progressEvent: AxiosProgressEvent) {
                        const percentCompleted = progressEvent.total ? Math.floor((progressEvent.loaded * 100) / progressEvent.total) : 0;
                        fileItem.progress[configID] = percentCompleted
                        fileItem.status[configID] = 'uploading'
                    }
                }
                // 6. 发起请求
                try {
                    // 使用 await 等待 HttpRequest 完成
                    const res = await HttpRequest(axiosConfig);
                    fileItem.status[configID] = 'completed';
                    return res.data;
                } catch (error) {
                    console.error(error);
                    fileItem.status[configID] = 'failed';
                    return { error: error, message: '上传失败' };
                }

            }
        }),
    };
}

// ================================================
export async function getUploadPath(file: File, ProgramConfigurations: ProgramConfigurationType): Promise<string> {
    let Path: string = await custom_Replace(ProgramConfigurations.UploadPath as string, file, ProgramConfigurations) as string;
    if (Path === "/") {
        Path = "/";
    } else if (!Path || Path.trim() === "") {
        Path = "/";
    } else {
        Path = `/${Path.replace(/^\/|\/$/g, "")}/`;
    }
    if (ProgramConfigurations.Program === "AWS_S3") {
        // 去掉开头的/
        Path = Path.replace(/^\//, '');
    }
    return Path;
}
// 辅助函数：根据路径字符串获取对象的值
function getValueByPath(obj: { [key: string]: any; }, pathStr: string): any {
    if (!pathStr) return obj;
    const segments = pathStr.split('.');
    let current = obj;
    for (const seg of segments) {
        if (current && typeof current === 'object' && seg in current) {
            current = current[seg];
        } else {
            return undefined;
        }
    }
    return current;
}
// ================================================
// 【上传成功】
// ================================================
export async function uploadSuccess(ProgramConfigurations: ProgramConfigurationType, fileItem: UploadFileType | backgroundSendFileType, result: any) {
    const file = fileItem.file as File;
    let imageUrl: string = "";
    let resultMessage: string = "";
    const filename = fileItem.uploadPath + file.name;
    try {
        switch (ProgramConfigurations.Program) {
            case 'Lsky':
                const version = ProgramConfigurations.version
                imageUrl = version == 1 ? result.data.links.url : result.data.public_url
                resultMessage = result.message
                break;
            case 'EasyImages':
                imageUrl = result.url
                resultMessage = result.message
                break;
            case 'ImgURL':
                imageUrl = result.data.url
                resultMessage = result.msg
                break;
            case 'SM_MS':
                imageUrl = result.data.url
                resultMessage = result.message
                break;
            case 'Chevereto':
                imageUrl = result.image.url
                break;
            case 'Hellohao':
                imageUrl = result.data ? result.data.url : '';
                resultMessage = result.info
                break;
            case 'Imgur':
                imageUrl = result.data.link
                break;
            case 'Tencent_COS':
                //腾讯云cos拼接
                if (!ProgramConfigurations.custom_DomainName) {
                    ProgramConfigurations.custom_DomainName = "https://" + ProgramConfigurations.Bucket + ".cos." + ProgramConfigurations.Region + ".myqcloud.com"
                }
                imageUrl = ProgramConfigurations.custom_DomainName + filename
                resultMessage = "上传成功"
                break;
            case 'Aliyun_OSS':
                //阿里云oss拼接
                if (!ProgramConfigurations.custom_DomainName) {
                    ProgramConfigurations.custom_DomainName = "https://" + ProgramConfigurations.Bucket + "." + ProgramConfigurations.Endpoint
                }
                imageUrl = ProgramConfigurations.custom_DomainName + filename
                resultMessage = "上传成功"
                break;
            case 'AWS_S3':
                if (!ProgramConfigurations.custom_DomainName) {
                    ProgramConfigurations.custom_DomainName = "https://s3." + ProgramConfigurations.Region + ".amazonaws.com/" + ProgramConfigurations.Bucket
                }
                imageUrl = ProgramConfigurations.custom_DomainName + result.Key
                resultMessage = "上传成功"
                break;
            case 'GitHub':
                imageUrl = `https://raw.githubusercontent.com/` + ProgramConfigurations.Owner + `/` + ProgramConfigurations.Repository + `/main` + filename
                resultMessage = "上传成功"
                break;
            case 'IMGDD':
                imageUrl = result.url
                resultMessage = "上传成功"
                break;
            case 'Custom':
                if (ProgramConfigurations.responsePath) {
                    imageUrl = await getValueByPath(result, ProgramConfigurations.responsePath)
                } else {
                    imageUrl = result
                }

                if ((ProgramConfigurations.keyReplace ?? []).length > 0) {
                    imageUrl = replaceKeywords(imageUrl, ProgramConfigurations.keyReplace ?? [])
                }
                imageUrl = ProgramConfigurations.responseAppend + imageUrl + ProgramConfigurations.responsePrefix
                resultMessage = "上传成功"
                break;
        }
    } catch (error) {
        console.log(error);
        imageUrl = "上传失败"
    }
    const info = {
        url: imageUrl ? imageUrl : resultMessage,
        originalUrl: imageUrl ? imageUrl : resultMessage,
        name: file.name,
        message: resultMessage,
    }
    let storData = {
        file: file,
        Program: ProgramConfigurations.Program,
        url: info.url,
        MethodName: "normal",
        uploadDomainName: "Unknown"
    }
    switch (ProgramConfigurations.Program) {
        case 'Custom':
            storData.uploadDomainName = ProgramConfigurations.Url || "Custom";
            break;
        case 'Tencent_COS':
        case 'Aliyun_OSS':
        case 'AWS_S3':
            storData.uploadDomainName = ProgramConfigurations.custom_DomainName || ProgramConfigurations.Program.replace('_', ' ');
            break;
        case 'GitHub':
            storData.uploadDomainName = "GitHub.com";
            break;
        default:
            storData.uploadDomainName = ProgramConfigurations.Host as string;
            break;
    }
    const currentDate = new Date();
    taskQueue(() => uploadRecordsStorage({
        key: crypto.randomUUID(),
        url: storData.url,
        uploadExe: `${storData.Program}`,
        upload_domain_name: storData.uploadDomainName,
        original_file_name: storData.file.name,
        file_size: storData.file.size,
        img_file_size: "宽:不支持,高:不支持",
        uploadTime: `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日${currentDate.getHours()}时${currentDate.getMinutes()}分${currentDate.getSeconds()}秒`
    }));
    chrome.runtime.sendMessage({ AutoInsert: imageUrl }); //自动插入图片
    return info;

}
// ================================================
// 关键词替换
// ================================================
function replaceKeywords(content: string, keyReplace: { key: string; value: string; }[]): string {
    // 遍历所有替换规则
    keyReplace.forEach(({ key, value }) => {
        // 使用全局正则替换所有匹配的 key 为对应的 value
        // 注意：如果 key 中包含特殊正则字符，需要进行转义处理
        const regex = new RegExp(key, 'g');
        content = content.replace(regex, value);
    });
    return content;
}


// ================================================
// 【函数词替换】
// ================================================
// 预编译静态替换的正则表达式
const replacementKeys = [
    '$date$', '$date(yyyy)$', '$date(mm)$', '$date(dd)$',
    '$date(hh)$', '$date(min)$', '$date(ss)$', '$date(ms)$',
    '$date(time)$', '$date(Time)$', '$fileName$', '$fileSize$',
    '$fileSize(KB)$', '$fileSize(MB)$', '$fileSize(GB)$',
    '$fileType$', '$uuid$'
].map(escapeRegExp);

const replacementRegex = new RegExp(replacementKeys.join('|'), 'g');

// 预编译随机数的正则表达式
const randomNumberRegex = /\$randomNumber\((\d+)\)\$/g;
// 预编译随机字符串的正则表达式
const randomStringRegex = /\$randomString\((\d+)\)\$/g;
// 替换占位符


export async function custom_Replace(inputString: string | object, file: File, ProgramConfigurations: ProgramConfigurationType): Promise<string | File> {
    try {
        // 判断 inputString 的类型
        if (typeof inputString === 'object' && file?.name) {
            // 处理对象类型的 inputString
            if ((inputString as unknown as string).includes('$fileBase64$')) {
                return await generateBase64(file) as string;
            }
            if ((inputString as unknown as string).includes('$$fileBase64Pure$$')) {
                const base64 = await generateBase64(file) as string;
                return base64.replace(/^data:image\/\w+;base64,/, '') as string;
            }
            if ((inputString as unknown as string).includes('$file$')) {
                return file;
            }
            // 默认情况下返回 file 对象
            return file;
        }

        if (typeof inputString !== 'string') {
            throw new TypeError('inputString 必须是字符串或对象');
        }

        // 提取当前日期和时间的各个组成部分
        const currentDate = new Date();
        const [
            currentYear, currentMonth, currentDay,
            currentHour, currentMinute, currentSecond,
            currentMillisecond
        ] = [
                currentDate.getFullYear(),
                (currentDate.getMonth() + 1).toString().padStart(2, '0'),
                currentDate.getDate().toString().padStart(2, '0'),
                currentDate.getHours().toString().padStart(2, '0'),
                currentDate.getMinutes().toString().padStart(2, '0'),
                currentDate.getSeconds().toString().padStart(2, '0'),
                currentDate.getMilliseconds().toString().padStart(3, '0')
            ];

        const currentTimestampMs = currentDate.getTime();
        const currentTimestamp = Math.floor(currentTimestampMs / 1000);

        // 定义静态替换映射
        const replacements: { [key: string]: string | number } = {
            '$date$': currentDate.toLocaleDateString(),
            '$date(yyyy)$': currentYear,
            '$date(mm)$': currentMonth,
            '$date(dd)$': currentDay,
            '$date(hh)$': currentHour,
            '$date(min)$': currentMinute,
            '$date(ss)$': currentSecond,
            '$date(ms)$': currentMillisecond,
            '$date(time)$': currentTimestampMs,
            '$date(Time)$': currentTimestamp,
            '$fileName$': file?.name || '',
            '$fileSize$': file?.size || 0,
            '$fileSize(KB)$': file ? (file.size / 1024).toFixed(2) : '0.00',
            '$fileSize(MB)$': file ? (file.size / (1024 ** 2)).toFixed(2) : '0.00',
            '$fileSize(GB)$': file ? (file.size / (1024 ** 3)).toFixed(2) : '0.00',
            '$fileType$': file?.type || '',
            '$uuid$': crypto.randomUUID(),
        };

        let replacedString = inputString as string;
        // 替换 $file$ 占位符 
        if (replacedString.includes('$file$')) {
            if (ProgramConfigurations.bodyType === 'form-data') {
                return file;
            }
            replacedString = replacedString.replace('$file$', file as unknown as string);
        }
        // 替换 $fileBase64$ 占位符
        if (replacedString.includes('$fileBase64$')) {
            const base64 = await generateBase64(file);
            replacedString = replacedString.replace('$fileBase64$', base64 as string);
        }

        // 替换 $$fileBase64Pure$$ 占位符
        if (replacedString.includes('$fileBase64Pure$')) {
            const base64Pure = (await generateBase64(file) as string).replace(/^data:image\/\w+;base64,/, '');
            replacedString = replacedString.replace('$fileBase64Pure$', base64Pure);
        }

        // 替换随机数占位符 $randomNumber(length)$
        replacedString = replacedString.replace(randomNumberRegex, (match, length) => {
            return generateRandomNumber(parseInt(length, 10));;
        });

        // 替换随机字符串占位符 $randomString(length)$
        replacedString = replacedString.replace(randomStringRegex, (match, length) => {
            return generateRandomString(parseInt(length, 10));
        });

        // 替换其他静态占位符
        replacedString = replacedString.replace(replacementRegex, (match) => replacements[match] as string || match);

        return replacedString;

    } catch (error) {
        console.error('custom_Replace 函数出错:', error);
        throw error;
    }
}
// 递归替换对象中的占位符
async function custom_ReplaceInObject(obj: any, file: File, ProgramConfigurations: ProgramConfigurationType): Promise<any> {
    // 1) 如果不是对象或为null，直接判断是否是字符串，是字符串就替换，否则原样返回
    if (typeof obj !== 'object' || obj === null) {
        if (typeof obj === 'string') {
            // 这里等待 custom_Replace 处理完再返回
            return await custom_Replace(obj, file, ProgramConfigurations);
        }
        return obj;
    }

    // 2) 如果是数组，遍历每一项做异步处理
    if (Array.isArray(obj)) {
        const results = [];
        for (const item of obj) {
            results.push(await custom_ReplaceInObject(item, file, ProgramConfigurations));
        }
        return results;
    }

    // 3) 否则就是普通对象，逐个 key 处理
    const content: { [key: string]: any } = {};
    for (const key in obj) {
        // 异步递归处理子元素
        content[key] = await custom_ReplaceInObject(obj[key], file, ProgramConfigurations);
    }
    return content;
}
// 辅助函数：转义正则表达式中的特殊字符
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 辅助函数：将 { key: ..., value: ... } 结构的数组转为对象

/**
 * 将一个包含键值对的对象转换为一个新的对象。
 * 
 * @param pairsObj - 包含键值对的对象。每个键值对应一个对象，格式为 { key: ..., value: ... }。
 * @returns 如果输入不是对象或为 null，直接返回输入值。否则返回一个新的对象，
 *          其中每个键值对的 key 和 value 被转换为新的对象的属性和值。
 *          如果某个键值对不是 { key: ..., value: ... } 格式，则原样放回。
 */
interface ConvertedObject {
    [key: string]: any;
}
function convertPairsToObject(pairsObj: { [key: string]: { key: string; value: any; } | any }): ConvertedObject {
    // 如果不是对象或 null，直接返回
    if (typeof pairsObj !== 'object' || pairsObj === null) {
        return pairsObj;
    }

    const newObj: ConvertedObject = {};
    for (const idx in pairsObj) {
        const entry = pairsObj[idx];
        // 如果每个 entry 都是 { key: ..., value: ... } 格式，才转换
        if (
            entry &&
            typeof entry === 'object' &&
            'key' in entry &&
            'value' in entry
        ) {
            newObj[entry.key] = entry.value;
        } else {
            // 万一有些不是 key-value 结构，就原样放回
            newObj[idx] = entry;
        }
    }
    return newObj;
}