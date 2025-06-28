import { useUploadRecordsStore } from '@/stores/uploadRecords';
import { useLocalStorage } from '@/stores/useLocalStorage';
import { useIndexedDB } from '@/stores/useIndexedDB';
import { getNetworkImagesData } from '@/composables/uploadRecords/common';
import { getFileType } from '@/utils/main';
import { usePagination } from '@/composables/uploadRecords/usePagination';
import { useMessage } from 'naive-ui';
import { storeToRefs } from 'pinia';
import type { imagesTotalType, UploadLogType } from '@/type';



export function useImageLoader() {
    const message = useMessage();
    const {
        setLoading,  //更新加载状态
        setImagesTotal,  //更新图片总数据
        setImagesData,  //更新图片分页数据
        setPage,  //更新页码
        setPageSize,  //更新每页数量
        setSelectedImages //更新选中图片
    } = useUploadRecordsStore();

    const {
        loadingMode,  //加载模式
        page,  //页码
    } = storeToRefs(useUploadRecordsStore()) //  保持响应式
    // 通用加载逻辑
    const loadImages = async () => {
        if (loadingMode.value === 'local') {
            loadLocalImages();
        } else {
            loadNetworkImages();
        }
    };

    // 加载本地图片
    const loadLocalImages = async () => {
        setLoading({ imagesBox: true });
        try {
            const result = await useLocalStorage.get("UploadLog") as UploadLogType[];
            if (!result) {
                resetImageData()
                return;
            }
            if (Array.isArray(result) && result.length > 0) {
                await useIndexedDB.Uploads.put(result);
                await useLocalStorage.set("UploadLog", []);
                window.location.reload();
            }

            const uploadLog = await useIndexedDB.Uploads.getAll();
            updateImageTypes(uploadLog);
            setImagesTotal(uploadLog);
            usePagination().pageChange(page.value);
        } catch (error) {
            console.error("加载图片时出错：", error);
        } finally {
            setLoading({ imagesBox: false });
            setSelectedImages([]);
        }
    };

    // 加载网络图片
    const loadNetworkImages = async (networkPage = 1) => {
        setLoading({ imagesBox: true });
        try {
            const result = await getNetworkImagesData(networkPage) as imagesTotalType | { type: 'error', message: string };
            if (result.type == 'error') {
                console.log("加载网络图片失败", result);
                resetImageData();
            } else {
                updateImageTypes(result as imagesTotalType);
                updateImageData(result as imagesTotalType);
            }
        } finally {
            setLoading({ imagesBox: false });
            setSelectedImages([]);
        }
    };

    // 辅助函数:重置图片数据
    function resetImageData() {
        setImagesTotal([]);
        setImagesData([]);
        setPage(1);
        setPageSize(20);
    }

    // 辅助函数:更新图片数据
    function updateImageData(data: imagesTotalType) {
        setImagesTotal(data);
        setImagesData(data.data);
        setPage(data.page);
        setPageSize(data.pageSize);
    }

    // 更新图片类型
    function updateImageTypes(data: imagesTotalType | UploadLogType[]) {
        if (loadingMode.value == "local") {
            (data as UploadLogType[]).forEach((item: UploadLogType) => {
                try {
                    if (item.type == 'dir') return;
                    const fileExtension = item.url.toLowerCase().match(/\.[0-9a-z]+$/);
                    item.type = getFileType(fileExtension ? fileExtension[0] : '');
                } catch (error) {
                    item.type = "none";
                }
            });
        } else {
            if (!(data as imagesTotalType).data) { return; }
            (data as imagesTotalType).data.forEach((item: UploadLogType) => {
                try {
                    if (item.type == 'dir') return;
                    const fileExtension = item.url.toLowerCase().match(/\.[0-9a-z]+$/);
                    item.type = fileExtension ? getFileType(fileExtension[0]) : 'unknown';
                } catch (error) {
                    item.type = "none";
                }
            });
        }

    }
    return {
        loadImages,
        loadLocalImages,
        loadNetworkImages
    };
}
