
import { useIndexedDB } from '@/stores/useIndexedDB';
import { useLocalStorage } from '@/stores/useLocalStorage';
import { programData } from '@/stores/program';
import { oldVersionTransformData } from '@/utils/configReplace';
import type { ConfigResponse, ProgramConfigurationType } from '@/type/index'
import { generateUniqueId } from '@/utils/generate';
function sortObjectProperties(obj: Record<string, any>) {
    // 数据排序
    const sortedObj: Record<string, any> = {};
    const sortedKeys = Object.keys(obj).sort();

    for (const key of sortedKeys) {
        sortedObj[key] = obj[key];
    }

    return sortedObj;
}
function isSameData(data1: any, data2: any) {
    //非常重要，判断是否相同
    const excludedProps = ['ConfigName'];
    for (const key of Object.keys(data2)) {
        if (!excludedProps.includes(key) && data1[key] !== data2[key]) {
            return false;
        }
    }
    return true;
}

/**
 * 存储图床配置记录 indexDB存储
 * @param {JSON} data 
 * @returns 
 */
export async function useDB_BedConfig(formData: ProgramConfigurationType) {
    // 深度拷贝为data并转为字符串
    const data = JSON.parse(JSON.stringify(formData));
    try {
        const sortedData = sortObjectProperties(data);
        const BedConfig = await useIndexedDB.BedConfigStore.getAll();
        const existingData = BedConfig.find(item => isSameData(item.data, sortedData));
        if (existingData) {
            // 更新已有数据
            existingData.data = sortedData;
            await useIndexedDB.BedConfigStore.put(existingData);
            console.log("数据更新成功", existingData);
            return {
                type: "success",
                message: {
                    title: "Data updated successfully",
                    content: "数据更新成功",
                }
            };
        } else {
            // 添加新数据
            const uniqueId = generateUniqueId();
            const configData = {
                id: uniqueId,
                data: sortedData,
                ConfigName: "配置" + BedConfig.length,
            };
            await useIndexedDB.BedConfigStore.put(configData);
            console.log("数据添加成功", configData);
            return {
                type: "success",
                message: {
                    title: "Data added successfully",
                    content: "数据添加成功",

                }
            };
        }
    } catch (error) {
        console.error("操作失败：", error);
        return {
            type: "error",
            message: {
                title: "Operation failed",
                content: "配置数据存储失败",
            }
        };
    }
}
/**
 * 存储图床配置 localStorage存储
 * @param {JSON} data 
 * @returns 
 */
export async function useLocal_ProgramConfiguration(data: ProgramConfigurationType) {
    try {
        const result = await useLocalStorage.get("ProgramConfiguration");
        const existingData = result || {};
        const updatedData = { ...existingData, ...data };
        await useLocalStorage.set("ProgramConfiguration", updatedData);
        return { type: "success", message: { title: "成功", content: "数据更新成功" } };
    } catch (error) {
        return {
            type: "error",
            message: {
                title: "失败",
                content: "该浏览器不支持存储API",
            },
            error
        };
    }
}

// 激活配置
export async function activateBedConfig(data: ProgramConfigurationType | ConfigResponse) {
    data = oldVersionTransformData(data); // 确保转换类型
    const programValue = 'data' in data && data.data ? (data.data as ProgramConfigurationType).Program : (data as ProgramConfigurationType).Program;
    let filteredData = programData.filter(Data => Data.value === programValue);
    let indexedData = filteredData.map((item, index) => ({
        ...item,
        index: 1000 + index
    }));
    if (indexedData.length < 1) {
        return { type: "error", message: { title: "Error", content: "未找到匹配的数据" } };
    }

    try {
        const saveData = 'data' in data ? data.data : data;
        await useLocal_ProgramConfiguration(saveData as ProgramConfigurationType);
        await useIndexedDB.ApplicationMenu.add(indexedData);
        return { type: "success", message: { title: "Success", content: "配置加载成功" } };
    } catch (error) {
        return { type: "error", message: { title: "Error", content: "配置加载失败" }, error };
    }
}
