import { storeToRefs } from 'pinia';
import { useUploadRecordsStore } from '@/stores/uploadRecords';
import { copyText, generateLink } from '@/utils/main';
import HttpRequest from '@/utils/httpRequest';
import { useLocalStorage } from '@/stores/useLocalStorage';
import { useIndexedDB } from '@/stores/useIndexedDB';
import { COS_Client, OSS_Client, S3_Client } from '@/utils/authObjStorage.ts';
import { ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { taskQueue } from '@/utils/TaskQueue.js';
import type COS from 'cos-js-sdk-v5'
import type OSS from 'ali-oss'
import type { S3Client } from "@aws-sdk/client-s3"
import type { AxiosError } from 'axios';
import type { GetBucketParams, GetBucketResult } from 'cos-js-sdk-v5';;
import type { ListObjectsV2Output } from "@aws-sdk/client-s3";
import type {
    imagesTotalType, UploadLogType, deleteResultType, ProgramConfigurationType,
    lsky_ImagesListResponseType,
    lskyV2_ImagesListResponseType,
    smms_ImagesListResponseType,
    hellohao_ImagesListResponseType,
    github_FileListResponseType,
} from '@/type';
// 新增全局缓存对象，避免重复解析相同日期字符串
const dateCache = new Map<string, Date | null>();

// 修改后的 parseDate 函数：先查缓存，再执行解析并保存结果
function parseDate(dateStr: string) {
    if (dateCache.has(dateStr)) return dateCache.get(dateStr);
    let date: Date | null = null;
    const parsers = [
        // 解析中文日期格式 'YYYY年MM月DD日HH时mm分ss秒'
        (str: string) => {
            const match = str.match(
                /^(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*(\d{1,2})时(\d{1,2})分(\d{1,2})秒)?$/
            );
            if (match) {
                const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
                return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
            }
            return null;
        },
        // 解析 'YYYY-MM-DD' 或 'YYYY-MM-DD HH:mm:ss' 格式
        (str: string) => {
            const match = str.match(
                /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2}):(\d{1,2}))?$/
            );
            if (match) {
                const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
                return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
            }
            return null;
        },
        // 解析带月份名称的格式
        (str: string) => {
            str = str.replace(/\s*\(.*\)$/, '');
            const zhWeekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const enWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const zhMonths = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
            const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            zhWeekdays.forEach((zh, index) => { str = str.replace(zh, enWeekdays[index]); });
            zhMonths.forEach((zh, index) => { str = str.replace(zh, enMonths[index]); });
            str = str.trim().replace(/\s+/g, ' ');
            const dateObj = new Date(str);
            return isNaN(dateObj.getTime()) ? null : dateObj;
        },
        // 解析 ISO 8601 格式或其他可被 Date 解析的格式
        (str: string) => {
            const dateObj = new Date(str);
            return isNaN(dateObj.getTime()) ? null : dateObj;
        },
    ];
    for (const parser of parsers) {
        date = parser(dateStr);
        if (date) break;
    }
    if (!date) console.log(`时间转化失败，可能是格式未适配：${dateStr}`);
    dateCache.set(dateStr, date);
    return date;
}

// 修改 sortData：合并 store 调用
export function sortData(sortType: string) {
    if (!sortType) return;
    // 合并 store 调用
    const store = useUploadRecordsStore();
    const { setLoading, setImagesTotal, setImagesData } = store;
    const { imagesTotal, loadingMode, page, pageSize } = storeToRefs(store);

    setLoading({ imagesBox: true });
    let Data = loadingMode.value === "local"
        ? (imagesTotal.value as UploadLogType[])
        : (imagesTotal.value as imagesTotalType).data;

    switch (sortType) {
        case 'newest':
            Data.sort((a, b) => (parseDate(String(b.uploadTime))?.getTime() || 0) - (parseDate(String(a.uploadTime))?.getTime() || 0));
            break;
        case 'oldest':
            Data.sort((a, b) => (parseDate(String(a.uploadTime))?.getTime() || 0) - (parseDate(String(b.uploadTime))?.getTime() || 0));
            break;
        case 'largest':
            Data.sort((a, b) => (Number(b.file_size) || 0) - (Number(a.file_size) || 0));
            break;
        case 'smallest':
            Data.sort((a, b) => (Number(a.file_size) || 0) - (Number(b.file_size) || 0));
            break;
        case 'name':
            Data.sort((a, b) => a.original_file_name.localeCompare(b.original_file_name));
            break;
        default:
            break;
    }
    setImagesTotal(loadingMode.value === "local" ? Data : { ...imagesTotal.value, data: Data });

    if (loadingMode.value === "local") {
        requestAnimationFrame(() => {
            const startIndex = (page.value - 1) * pageSize.value;
            const endIndex = startIndex + pageSize.value;
            setImagesData((imagesTotal.value as UploadLogType[]).slice(startIndex, endIndex));
        });
    }
    setLoading({ imagesBox: false });
}

// 修改 isSelected：同样合并 store 调用
export function isSelected(key: string) {
    const store = useUploadRecordsStore();
    const { selectedImages } = storeToRefs(store);
    return selectedImages.value.some(item => item.key === key);
}

// 复制操作
export async function copyOperation(imgItem: UploadLogType[], mode: string) {
    if (imgItem.length < 1) return { message: '没有选中的图片', type: 'warning' };
    const copiedUrls = imgItem.map(url => generateLink(mode, url.url, url.original_file_name));
    return await copyText(copiedUrls.join("\n"))
}

// 通用删除处理函数
export async function handleDelete(keys: { key: string, filename: string }[]) {
    const {
        setLoading,  //更新加载状态
        setImagesTotal,  //更新图片总数据
        setImagesData,  //更新图片分页数据
        setSelectedImages,  //更新选中图片
    } = useUploadRecordsStore();
    const {
        imagesTotal,  //图片总数据
        imagesData,  //图片数据
        loadingMode,  //加载模式
        selectedImages,  //选中图片
    } = storeToRefs(useUploadRecordsStore()) //  保持响应式
    setLoading({ imagesBox: true });
    deleteImagesData(keys, (res) => {
        const result = res as deleteResultType;
        if (!result) return {
            message: '删除操作失败',
            type: 'error',
            error: result,
        };
        if (result.type !== 'success') {
            return {
                message: '删除操作失败',
                type: 'error',
                error: result,
            };
        };
        if (loadingMode.value === 'local') {
            setImagesTotal((imagesTotal.value as UploadLogType[]).filter(image => !keys.some(key => key.key === image.key)))
        } else {
             setImagesTotal({
        ...(imagesTotal.value as imagesTotalType),
        data: (imagesTotal.value as imagesTotalType).data.filter(image => !keys.some(key => key.key === image.key))
    })
        }
        setImagesData(imagesData.value.filter(image => !keys.some(key => key.key === image.key)))
        setSelectedImages(selectedImages.value.filter(selectedItem => !keys.some(key => key.key === selectedItem.key)));
        return {
            message: '删除成功',
            type: 'success',
        };
    }).catch((error: unknown) => {
        console.error(error);
        setLoading({ imagesBox: false });
        return {
            message: '删除操作失败',
            type: 'error',
            error: error,
        };
    }).finally(() => {
        setLoading({ imagesBox: false });
    });

}



export async function getNetworkImagesData(networkPage = 1) {
    try {
        const StorageData = await useLocalStorage.get(``)
        const ProgramConfigurations: ProgramConfigurationType = StorageData.ProgramConfiguration
        const actions = {
            'Lsky': async () => {
                try {
                    const v1 = `https://${ProgramConfigurations.Host}/api/v1/images?page=${networkPage}`
                    const v2 = `https://${ProgramConfigurations.Host}/api/v2/user/photos?page=${networkPage}`
                    const url = ProgramConfigurations.version === 1 ? v1 : v2
                    const response = await HttpRequest.get(url, {
                        headers: {
                            "Accept": "application/json",
                            "Authorization": ProgramConfigurations.Token
                        },
                        programConfiguration: ProgramConfigurations
                    });
                    const responseData = response.data.data;
                    const imagesData = responseData.data || [];
                    const transformedData: UploadLogType[] = imagesData.map((imageData: lsky_ImagesListResponseType | lskyV2_ImagesListResponseType) => {
                        const isV1 = ProgramConfigurations.version === 1;
                        const v1Data = imageData as lsky_ImagesListResponseType;
                        const v2Data = imageData as lskyV2_ImagesListResponseType;

                        return {
                            "file_size": isV1 ? Number(v1Data.size) * 1024 : (v2Data.size ? Number(v2Data.size) * 1024 : 0),
                            "img_file_size": `宽:${imageData.width},高:${imageData.height}`,
                            "key": isV1 ? v1Data.key : v2Data.id,
                            "original_file_name": isV1 ? v1Data.name : v2Data.filename,
                            "uploadExe": ProgramConfigurations.Program || '',
                            "uploadTime": isV1 ? v1Data.date : v2Data.created_at,
                            "upload_domain_name": ProgramConfigurations.Host || '',
                            "url": isV1 ? v1Data.links.url : v2Data.public_url,
                        };
                    });

                    return {
                        data: transformedData,
                        page: responseData.current_page ? responseData.current_page : responseData.meta.current_page,
                        pageSize: responseData.per_page ? responseData.per_page : responseData.meta.per_page,
                        total: responseData.total ? responseData.total : responseData.meta.total,
                        type: "success"
                    };
                } catch (error: unknown) {
                    console.error("请求错误:", error);
                    if ((error as AxiosError).response) {
                        return { message: '请求错误', type: "error" };
                    }
                }
            },
            'SM_MS': async () => {
                const response = await HttpRequest.get(`https://${ProgramConfigurations.Host}/api/v2/upload_history?page=${networkPage}`, {
                    headers: {
                        "Accept": "multipart/form-data",
                        "Authorization": ProgramConfigurations.Token
                    },
                    programConfiguration: ProgramConfigurations
                });
                const imagesData: smms_ImagesListResponseType[] = response.data.data
                if (!response.data.data) {
                    return { message: response.data.message, type: "error" }
                }
                const transformedData = imagesData.map(imageData => ({
                    "file_size": imageData.size,
                    "img_file_size": `宽:${imageData.width},高:${imageData.height}`,
                    "key": imageData.hash,
                    "original_file_name": imageData.filename,
                    "uploadExe": ProgramConfigurations.Program,
                    "uploadTime": imageData.created_at,
                    "upload_domain_name": ProgramConfigurations.Host,
                    "url": imageData.url,
                }));
                // 创建一个新的对象，包含图片数据数组和分页信息
                return {
                    data: transformedData,
                    page: response.data.CurrentPage,
                    pageSize: response.data.PerPage,
                    total: response.data.TotalPages,
                    type: "success"
                };
            },
            'Hellohao': async () => {

                // // todo  测试时 请求服务器错误
                // const response = await HttpRequest.post(`https://${ProgramConfigurations.Host}/api/getimglist/`, {
                //     "pageNum": networkPage,
                //     "pageSize": 20,
                //     "token": ProgramConfigurations.Token,
                // }, {
                //     headers: {
                //         "Content-Type": "multipart/form-data"
                //     }
                // });
                // let imagesData: hellohao_ImagesListResponseType[] = response.data.data.rows
                // const transformedData: UploadLogType[] = imagesData.map(imageData=> ({
                //     "file_size": imageData.sizes,
                //     "img_file_size": `宽:不支持,高:不支持`,
                //     "key": imageData.delkey,
                //     "original_file_name": imageData.imgurl.match(/\/([^\/]+)\/?$/)[1],
                //     "uploadExe": ProgramConfigurations.Program,
                //     "uploadTime": imageData.updatetime,
                //     "upload_domain_name": ProgramConfigurations.Host,
                //     "url": imageData.imgurl,
                // }));
                // return {
                //     data: transformedData,
                //     page: networkPage,
                //     pageSize: 20,
                //     total: response.data.data.total,
                //     type: "success"
                // };
            },
            'Tencent_COS': async () => {
                // 腾讯云cos拼接
                if (!ProgramConfigurations.custom_DomainName) {
                    ProgramConfigurations.custom_DomainName = "https://" + ProgramConfigurations.Bucket + ".cos." + ProgramConfigurations.Region + ".myqcloud.com/";
                }
                try {
                    const ObjectStorage = await COS_Client({ data: ProgramConfigurations }) as COS;
                    const getBucketAsync = (params: GetBucketParams) => {
                        return new Promise((resolve, reject) => {
                            ObjectStorage.getBucket(params, function (err, data) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(data);
                                }
                            });
                        });
                    };
                    const data = await getBucketAsync({
                        Bucket: ProgramConfigurations.Bucket as string,
                        Region: ProgramConfigurations.Region as string,
                        Prefix: StorageData.accessPath == '' ? '' : StorageData.accessPath,
                        MaxKeys: 1000,
                    }) as GetBucketResult;

                    let imagesData = data.Contents
                    const transformedData = imagesData.map(imageData => ({
                        "file_size": imageData.Size,
                        "img_file_size": `宽:不支持,高:不支持`,
                        "key": imageData.Key,
                        "original_file_name": imageData.Key,
                        "uploadExe": ProgramConfigurations.Program,
                        "uploadTime": imageData.LastModified,
                        "upload_domain_name": ProgramConfigurations.custom_DomainName,
                        "url": ProgramConfigurations.custom_DomainName + imageData.Key,
                    }));
                    return {
                        data: transformedData,
                        page: 1,
                        pageSize: 20,
                        total: imagesData.length,
                        type: "success"
                    };
                } catch (error) {
                    return { error: error, message: `COS获取数据失败：${(error as Error).message}`, type: "error" };
                }
            },
            'Aliyun_OSS': async () => {
                //阿里云oss拼接
                if (!ProgramConfigurations.custom_DomainName) {
                    ProgramConfigurations.custom_DomainName = "https://" + ProgramConfigurations.Bucket + "." + ProgramConfigurations.Endpoint + "/"
                }

                try {
                    const ObjectStorage = await OSS_Client({ data: ProgramConfigurations }) as OSS;
                    const result = await ObjectStorage.listV2({
                        prefix: StorageData.UploadPath == '' ? '' : StorageData.UploadPath,
                        "max-keys": "1000"
                    }, {});

                    let imagesData = result.objects
                    const transformedData = imagesData.map(imageData => ({
                        "file_size": imageData.size,
                        "img_file_size": `宽:不支持,高:不支持`,
                        "key": imageData.name,
                        "original_file_name": imageData.name,
                        "uploadExe": ProgramConfigurations.Program,
                        "uploadTime": imageData.lastModified,
                        "upload_domain_name": ProgramConfigurations.custom_DomainName,
                        "url": ProgramConfigurations.custom_DomainName + imageData.name,
                    }));
                    return {
                        data: transformedData,
                        page: 1,
                        pageSize: 20,
                        total: imagesData.length,
                        type: "success"
                    };
                } catch (error) {
                    return { error: error, message: `OSS获取数据失败：${(error as Error).message}`, type: "error" };
                }
            },
            'AWS_S3': async () => {
                //AWS S3拼接
                if (!ProgramConfigurations.custom_DomainName) {
                    ProgramConfigurations.custom_DomainName = "https://s3." + ProgramConfigurations.Region + ".amazonaws.com/" + ProgramConfigurations.Bucket + "/"
                }
                try {
                    const ObjectStorage = await S3_Client({ data: ProgramConfigurations }) as S3Client;
                    const params = {
                        Bucket: ProgramConfigurations.Bucket,
                        Prefix: StorageData.accessPath == '' ? '' : StorageData.accessPath,
                        MaxKeys: 1000, // 使用数字而非字符串
                    };
                    const command = new ListObjectsV2Command(params);
                    const response = await ObjectStorage.send(command) as ListObjectsV2Output;

                    let imagesData = response.Contents || []
                    const transformedData = imagesData.map(imageData => ({
                        "file_size": imageData.Size,
                        "img_file_size": `宽:不支持,高:不支持`,
                        "key": imageData.Key,
                        "original_file_name": imageData.Key,
                        "uploadExe": ProgramConfigurations.Program,
                        "uploadTime": imageData.LastModified,
                        "upload_domain_name": ProgramConfigurations.custom_DomainName,
                        "url": (ProgramConfigurations.custom_DomainName as string) + imageData.Key,
                    }));
                    return {
                        data: transformedData,
                        page: 1,
                        pageSize: 20,
                        total: imagesData.length,
                        type: "success"
                    };
                } catch (error) {
                    return { error: error, message: `S3获取数据失败：${(error as Error).message}`, type: "error" };
                }
            },
            'GitHub': async () => {
                try {
                    const Path = StorageData.accessPath == '' ? '' : StorageData.accessPath;
                    const _url = `https://api.github.com/repos/${ProgramConfigurations.Owner}/${ProgramConfigurations.Repository}/contents${Path}`
                    const response = await HttpRequest.get(_url, {
                        headers: {
                            'Content-Type': 'application/json',
                            "Authorization": 'Bearer ' + ProgramConfigurations.Token
                        },
                        programConfiguration: ProgramConfigurations
                    });
                    let imagesData: github_FileListResponseType[] = response.data;
                    const transformedData = imagesData.map((imageData: github_FileListResponseType) => ({
                        "file_size": imageData.size,
                        "img_file_size": `宽:不支持,高:不支持`,
                        "key": imageData.sha,
                        "original_file_name": imageData.name,
                        "uploadExe": ProgramConfigurations.Program,
                        "uploadTime": "GitHub不支持",
                        "upload_domain_name": ProgramConfigurations.Program,
                        "url": imageData.download_url,
                        "type": imageData.type,
                    }));
                    return {
                        data: transformedData,
                        page: 1,
                        pageSize: 20,
                        total: imagesData.length,
                        type: "success"
                    };
                } catch (error) {
                    console.error("请求错误:", error);
                    if ((error as AxiosError).response) {
                        // 根据状态码提供更具体的错误信息
                        let errorMessage = "";
                        switch ((error as AxiosError).response?.status) {
                            case 400:
                                errorMessage = "请求无效，请检查请求格式。";
                                break;
                            case 401:
                                errorMessage = "未授权：访问被拒绝，可能是因为Token无效。";
                                break;
                            case 403:
                                errorMessage = "禁止访问：可能是因为Token没有足够的权限。";
                                break;
                            case 404:
                                errorMessage = "资源未找到：请检查仓库名或路径是否正确。";
                                break;
                            case 422:
                                errorMessage = "无法处理的实体：请求格式正确，但是由于含有语义错误，无法响应。";
                                break;
                            case 500:
                                errorMessage = "内部服务器错误。";
                                break;
                            default:
                                errorMessage = `未知错误，状态码： ${(error as AxiosError).response?.status ?? '未知'}`;
                        }
                        return { error: error, message: errorMessage, type: "error" };
                    }
                }


            },
        };

        if (actions.hasOwnProperty(ProgramConfigurations.Program as string)) {
            return await actions[ProgramConfigurations.Program as keyof typeof actions]();
        } else {
            return { message: "没有数据", type: "error" }
        }
    } catch (error) {
        if ((error as AxiosError).request) {
            // 请求已经发起，但没有收到响应
            return { error: error, message: "请求没有响应", type: "error" };
        } else {
            // 发送请求时出了点问题
            return { error: error, message: `请求发送失败: ${(error as AxiosError).message}`, type: "error" };
        }
    }
}

interface ImageData {
    key: string;
    filename: string;
}
type CallbackFunction = (result: deleteResultType) => void;
async function deleteImagesData(keys: ImageData[], callback: CallbackFunction): Promise<deleteResultType[]> {
    const loadingMode = localStorage.getItem('loadingMode');
    const ProgramConfigurations = await useLocalStorage.get("ProgramConfiguration");
    const maxConcurrentRequests = ProgramConfigurations.Program === 'GitHub' ? 1 : 3;

    if (loadingMode === "local") {
        const deleteImage = async (imgData: ImageData): Promise<deleteResultType> => {
            return await localImageDelete(imgData) as deleteResultType
        };
        return await concurrentControl(keys, deleteImage, 1, (result) => {
            callback(result);
        });
    } else {
        const deleteImage = async (imgData: ImageData): Promise<deleteResultType> => {
            return await onlineImageDelete(imgData) as deleteResultType;
        };

        return await concurrentControl(keys, deleteImage, maxConcurrentRequests, (result) => {
            callback(result);
        });
    }
}
// 本地图片删除
function localImageDelete(imgData: ImageData) {
    return taskQueue(async () => useIndexedDB.Uploads.delete(imgData.key).then(() => {
        return { key: imgData.key, filename: imgData.filename, message: "删除成功", type: "success" };
    }).catch((error) => {
        return { key: imgData.key, filename: imgData.filename, error: error, message: "删除失败", type: "error" };
    })
    );
}
// 图片网络删除方法
async function onlineImageDelete(imgData: ImageData) {
    const StorageData = await useLocalStorage.get(``)
    const ProgramConfigurations = await useLocalStorage.get("ProgramConfiguration");
    const actions = {
        'Lsky': async () => {
            try {
                const v1 = `https://${ProgramConfigurations.Host}/api/v1/images/${imgData.key}`
                const v2 = `https://${ProgramConfigurations.Host}/api/v2/user/photos/?id=${imgData.key}`
                const url = ProgramConfigurations.version === 1 ? v1 : v2
                await HttpRequest.delete(url, {
                    headers: {
                        "Accept": "application/json",
                        "Authorization": ProgramConfigurations.Token
                    }
                    ,
                    programConfiguration: ProgramConfigurations
                });
                return { key: imgData.key, filename: imgData.filename, message: '删除成功', type: "success" };
            } catch (error) {
                return { key: imgData.key, filename: imgData.filename, error: error, message: '删除请求错误', type: "error" };
            }
        },
        'SM_MS': async () => {
            try {
                const response = await HttpRequest.get(`https://${ProgramConfigurations.Host}/api/v2/delete/${imgData.key}`, {
                    headers: {
                        "Accept": "multipart/form-data",
                        "Authorization": ProgramConfigurations.Token
                    }
                    ,
                    programConfiguration: ProgramConfigurations
                });

                if (response.data.message === "File already deleted.") {
                    return { key: imgData.key, filename: imgData.filename, message: imgData.filename + "：删除失败，请清理缓存或刷新页面！", type: "info" };
                } else {
                    return { key: imgData.key, filename: imgData.filename, message: response.data.message, type: response.data.code };
                }
            } catch (error) {
                console.log(error);
                return { key: imgData.key, filename: imgData.filename, error: error, message: imgData.filename + "删除失败", type: "error" };
            }
        },
        'Hellohao': async () => {
            try {
                const response = await HttpRequest.post(`https://${ProgramConfigurations.Host}/api/deleteimg/`, {
                    "delkey": imgData.key,
                    "token": ProgramConfigurations.Token,
                }, {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    },
                    programConfiguration: ProgramConfigurations
                });
                return response.data.code === 200 ? { key: imgData.key, filename: imgData.filename, message: response.data.data, type: "success" } : { key: imgData.key, filename: imgData.filename, message: response.data.msg, type: "info" };
            } catch (error) {
                console.log(error);
                return { key: imgData.key, filename: imgData.filename, error: error, message: imgData.filename + "删除失败", type: "error" };

            }
        },
        'Tencent_COS': async () => {
            try {
                const ObjectStorage = await COS_Client({ data: ProgramConfigurations }) as COS;
                await ObjectStorage.deleteObject({
                    Bucket: ProgramConfigurations.Bucket,
                    Region: ProgramConfigurations.Region,
                    Key: imgData.key,
                });
                return { key: imgData.key, filename: imgData.filename, message: "删除成功", type: "success" };
            } catch (error) {
                return { key: imgData.key, filename: imgData.filename, error: error, message: imgData.filename + "删除失败", type: "error" };
            }
        },
        'Aliyun_OSS': async () => {
            try {
                const ObjectStorage = await OSS_Client({ data: ProgramConfigurations }) as OSS;
                await ObjectStorage.delete(imgData.key);
                return { key: imgData.key, filename: imgData.filename, message: "删除成功", type: "success" };
            } catch (error) {
                return { key: imgData.key, filename: imgData.filename, error: error, message: imgData.filename + "删除失败", type: "error" };
            }
        },
        'AWS_S3': async () => {
            try {
                const ObjectStorage = await S3_Client({ data: ProgramConfigurations }) as S3Client;
                const deleteParams = { Bucket: ProgramConfigurations.Bucket, Key: imgData.key };
                await ObjectStorage.send(new DeleteObjectCommand(deleteParams));
                return { key: imgData.key, filename: imgData.filename, message: "删除成功", type: "success" };
            } catch (error) {
                console.log(error);
                return { key: imgData.key, filename: imgData.filename, error: error, message: imgData.filename + "删除失败", type: "error" };
            }
        },
        'GitHub': async () => {
            try {
                const Path = StorageData.accessPath == '' ? '' : StorageData.accessPath;
                const _url = `https://api.github.com/repos/${ProgramConfigurations.Owner}/${ProgramConfigurations.Repository}/contents${Path}${imgData.filename}`
                await HttpRequest.delete(_url, {
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": 'Bearer ' + ProgramConfigurations.Token
                    },
                    programConfiguration: ProgramConfigurations,
                    data: JSON.stringify({
                        message: 'Delete file',
                        sha: imgData.key
                    })
                });
                return { key: imgData.key, filename: imgData.filename, message: "删除成功", type: "success" };
            } catch (error) {
                console.error("请求错误:", error);
                if ((error as AxiosError).response) {
                    // 根据状态码提供更具体的错误信息
                    let errorMessage = "";
                    switch ((error as AxiosError).response?.status) {
                        case 400:
                            errorMessage = "请求无效，请检查请求格式。";
                            break;
                        case 401:
                            errorMessage = "未授权：访问被拒绝，可能是因为Token无效。";
                            break;
                        case 403:
                            errorMessage = "禁止访问：可能是因为Token没有足够的权限。";
                            break;
                        case 404:
                            errorMessage = "资源未找到：请检查仓库名或路径是否正确。";
                            break;
                        case 422:
                            errorMessage = "无法处理的实体：请求格式正确，但是由于含有语义错误，无法响应。";
                            break;
                        case 500:
                            errorMessage = "内部服务器错误。";
                            break;
                        default:
                            errorMessage = `未知错误，状态码： ${(error as AxiosError).response?.status ?? '未知'}`;
                    }
                    return { key: imgData.key, filename: imgData.filename, error: error, message: errorMessage, type: "error" };
                }
            }
        },
    };
    if (actions.hasOwnProperty(ProgramConfigurations.Program)) {
        return await actions[ProgramConfigurations.Program as keyof typeof actions]();
    } else {
        return { key: imgData.key, filename: imgData.filename, message: "没有数据", type: "error" };

    }
}

/**
* 并发执行异步任务的函数
* @param items - 待处理的项列表，每项包含 key 和 filename
* @param fn - 处理每一项的异步函数，接受一个 item 作为参数
* @param limit - 并发限制数
* @param onResult - 每次任务完成时的回调函数
* @returns 所有任务的结果
*/
async function concurrentControl<T, R>(
    items: T[],
    fn: (item: T) => Promise<R>,
    limit: number,
    onResult: (result: R) => void // 每次任务完成时的回调函数
): Promise<R[]> {  // 返回所有结果
    const executing: Promise<void>[] = [];
    const results: R[] = [];  // 用来存储每个任务的结果

    for (const item of items) {
        const promise = fn(item).then(result => {
            onResult(result);  // 每次任务完成时，调用回调返回结果
            results.push(result);  // 收集每个任务的结果
        });

        executing.push(promise);

        // 控制并发数，确保同时运行的 Promise 数量不超过 limit
        if (executing.length >= limit) {
            await Promise.race(executing);
            // 清理已完成的任务
            executing.splice(
                executing.findIndex(p => p === promise),
                1
            );
        }
    }

    // 等待所有任务完成并返回所有结果
    await Promise.all(executing);
    return results;  // 返回所有结果
}
