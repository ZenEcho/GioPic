import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { imagesTotalType, UploadLogType } from '@/type';

export const useUploadRecordsStore = defineStore('uploadRecords', () => {
    const loading = ref({ imagesBox: false }); //加载状态
    const imagesTotal = ref<imagesTotalType | UploadLogType[]>([]); //图片总数据
    const imagesData = ref<UploadLogType[]>([]); //图片数据
    const loadingMode = ref(localStorage.loadingMode || "local"); //加载模式
    const page = ref(1);  //页码
    const pageSize = ref(20); //每页数量
    const selectedSortType = ref('newest'); //选中排序类型
    const selectedImages = ref<UploadLogType[]>([]); //选中图片

    // 更新加载状态
    const setLoading = (status: { imagesBox: boolean }) => {
        loading.value = status;
    };
    // 更新图片总数据
    const setImagesTotal = (data: imagesTotalType | UploadLogType[]) => {
        imagesTotal.value = data;
    };
    // 更新图片分页数据
    const setImagesData = (data: UploadLogType[]) => {
        imagesData.value = data;
    };
    // 更新加载模式
    const setLoadingMode = (mode: string) => {
        loadingMode.value = mode;
        localStorage.loadingMode = mode;
    };
    // 更新页码
    const setPage = (newPage: number) => {
        page.value = newPage;
    };
    // 更新每页数量
    const setPageSize = (size: number) => {
        pageSize.value = size;
    };
    // 更新选中排序类型
    const setSelectedSortType = (type: string) => {
        selectedSortType.value = type;
    }
    // 更新选中图片
    const setSelectedImages = (images: UploadLogType[]) => {
        selectedImages.value = images;
    }

    return {
        loading, //加载状态
        imagesTotal,  //图片总数据
        imagesData,  //图片数据
        loadingMode,  //加载模式
        page,  //页码
        pageSize,  //每页数量
        selectedSortType,  //选中排序类型
        selectedImages,  //选中图片
        setLoading,  //更新加载状态
        setImagesTotal,  //更新图片总数据
        setImagesData,  //更新图片分页数据
        setLoadingMode,  //更新加载模式
        setPage,  //更新页码
        setPageSize,  //更新每页数量
        setSelectedSortType, //更新选中排序类型
        setSelectedImages //更新选中图片
    };
});