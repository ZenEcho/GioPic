// 导入数据类型 
import type { ConfigResponse, ProgramConfigurationType } from '@/type/index'
import { useIndexedDB } from '@/stores/useIndexedDB';
import { activateBedConfig } from '@/utils/storage';
import { generateUniqueId } from '@/utils/generate';
function wrapInputInArray(input: string): string {
    try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) {
            return input; // 如果已经是数组，直接返回
        }
        return `[${input}]`; // 如果是对象，包裹在数组中
    } catch (e) {
        return input; // 如果解析失败，返回原输入
    }
}

function isValidJson(json: any): boolean {
    return Array.isArray(json) || (typeof json === 'object' && json !== null);
}

function createError(content: string) {
    return {
        type: "error",
        message: {
            title: "失败",
            content,
            duration: 3000,
            keepAliveOnHover: true,
            placement: 'bottom'
        }
    };
}
export function oldVersionTransformData(oldData: Record<string, string> | ProgramConfigurationType | ConfigResponse): ProgramConfigurationType {
    const fieldMapping: { [key: string]: string } = {
        options_UploadPath: 'UploadPath',
        options_exe: 'Program',
        options_host: 'Host',
        options_token: 'Token',
        options_album_id: 'Album',
        options_permission_select: 'Privacy',
        options_source_select: 'Storage',
        options_nsfw_select: 'Nsfw',
        options_source: 'Source',
        options_AppId: 'AppId',
        options_Bucket: 'Bucket',
        options_Custom_domain_name: 'custom_DomainName',
        options_Region: 'Region',
        options_SecretId: 'SecretId',
        options_SecretKey: 'SecretKey',
        options_uid: 'Uid',
        options_imgur_post_mode: 'imgur_mode',
        options_Endpoint: 'Endpoint',
        options_owner: 'Owner',
        options_repository: 'Repository',
        options_parameter: 'Parameter',
        options_return_success: 'return_success',
        return_success: 'responsePath',
        Keyword_replacement1: 'Keyword_replacement1',
        Keyword_replacement2: 'Keyword_replacement2',
        custom_Base64Upload: 'custom_Base64Upload',
        custom_Base64UploadRemovePrefix: 'custom_Base64UploadRemovePrefix',
        custom_BodyStringify: 'custom_BodyStringify',
        custom_BodyUpload: 'custom_BodyUpload',
        custom_KeywordReplacement: 'custom_KeywordReplacement',
        custom_ReturnAppend: 'custom_ReturnAppend',
        custom_ReturnJson: 'custom_ReturnJson',
        custom_ReturnPrefix: 'custom_ReturnPrefix',
        options_Body: 'body',
        options_Headers: 'headers',
        Body: 'body',
        Headers: 'headers',
        options_apihost: 'Url',
        requestMethod: 'method'
    };

    const valueMapping = {
        Program: {
            "GitHubUP": "GitHub",
            "imgdd": "IMGDD",
            "UserDiy": "Custom",
            "BaiJiaHaoBed": "BaiJiaHao",
            "toutiaoBed": "toutiao",
        },
    };

    let newData: Record<string, any> = {};
    for (const [oldKey, oldValue] of Object.entries(oldData)) {
        const newKey = fieldMapping[oldKey] || oldKey;
        newData[newKey] = oldValue;
    }

    // 根据 valueMapping 进行特定值的转换
    for (const [field, mappings] of Object.entries(valueMapping)) {
        if (field in newData && (newData as any)[field] in mappings) {
            const key = field as keyof ProgramConfigurationType;
            const oldValue = newData[key] as string;
            const newValue = (mappings as Record<string, string>)[oldValue];
            newData[key] = newValue;
        }
    }

    // 处理 Body 和 Headers 字段
    if (newData.body) {
        try {
            if (typeof newData.body === 'string') {
                newData.body = Object.entries(JSON.parse(newData.body)).map(([key, value]) => ({ key, value: value as string }));
            } else if (!Array.isArray(newData.body)) {
                console.error("Body 数据格式不正确");
            }
        } catch (e) {
            console.error("Body 解析错误", e);
        }
    }

    if (newData.headers) {
        try {
            if (typeof newData.headers === 'string') {
                newData.headers = Object.entries(JSON.parse(newData.headers)).map(([key, value]) => ({ key, value: value as string }));
            } else if (!Array.isArray(newData.headers)) {
                console.error("Headers 数据格式不正确");
            }
        } catch (e) {
            console.error("Headers 解析错误", e);
        }
    }

    return newData as ProgramConfigurationType;
}

function processJsonArray(jsonArray: any[]): ConfigResponse[] {
    return jsonArray
        .filter(item => Object.keys(item).length > 0)
        .map(item => {
            if (!item.data) {
                const { ConfigName, ConfigTime, ...rest } = item;
                return {
                    id: generateUniqueId(),
                    data: oldVersionTransformData(rest),
                    ConfigName: ConfigName || "配置",
                };
            } else {
                return {
                    ...item,
                    id: generateUniqueId(),
                    data: oldVersionTransformData(item.data),
                };
            }
        });
}

export async function parseJsonInput(value: string): Promise<ConfigResponse[]> {
    return new Promise((resolve, reject) => {
        if (!value || value.trim() === "") {
            return reject(createError("导入配置:输入内容为空"));
        }

        try {
            value = wrapInputInArray(value.trim());
            const jsonArray = JSON.parse(value);

            if (isValidJson(jsonArray)) {
                if (jsonArray.length === 0) { return; }
                const newArray = processJsonArray(jsonArray);
                if (newArray.length === 1) {
                    activateBedConfig(newArray[0]).then(() => {
                    });
                }
                resolve(newArray);
            } else {
                reject(createError("导入配置:无法处理数据,请查看报错!"));
            }
        } catch (error) {
            console.error(error);
            reject(createError("导入配置:转换或者数据处理过程中出错了,详细错误请查看开发者工具(F12)!"));
        }
    });
}


// config 数据结构ConfigResponse
export async function configReplace(config: string) {
    try {
        const value = config;
        const newArray: ConfigResponse[] = await parseJsonInput(value);
        await useIndexedDB.BedConfigStore.clear();
        await useIndexedDB.BedConfigStore.add(newArray);
        return {
            title: "成功",
            content: "加载成功,即将重新加载页面！",
            duration: 3000,
        };
    } catch (error) {
        return error;
    }
}
export async function configAppend(config: string) {
    try {
        const value = config;
        const newArray: ConfigResponse[] = await parseJsonInput(value);
        await useIndexedDB.BedConfigStore.add(newArray);
        return {
            title: "成功",
            content: "加载成功,即将重新加载页面！",
            duration: 3000,
        }
    } catch (error) {
        return error;
    }
}
