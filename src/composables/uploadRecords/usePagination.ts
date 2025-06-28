
import { useUploadRecordsStore } from '@/stores/uploadRecords';
import type { imagesTotalType, UploadLogType } from '@/type';
import { sortData } from './common';
import { useImageLoader } from './useImageLoader';
import { useMessage } from 'naive-ui';



export function usePagination() {
    const { loadNetworkImages } = useImageLoader()
    const message = useMessage();
    const {
        setImagesData,  //更新图片分页数据
        setPageSize,  //更新每页数量
    } = useUploadRecordsStore();
    const {
        imagesTotal,  //图片总数据
        loadingMode,  //加载模式
        page,  //页码
        pageSize,  //每页数量
        selectedSortType,  //选中排序类型
    } = storeToRefs(useUploadRecordsStore()) //  保持响应式

    const pageChange = (newPage: number) => {
        requestAnimationFrame(() => {
            if (loadingMode.value == "local" || (imagesTotal.value as imagesTotalType).data.length > (imagesTotal.value as imagesTotalType).pageSize) {
                let startIndex = (newPage - 1) * pageSize.value;
                let endIndex = startIndex + pageSize.value;
                if ((imagesTotal.value as imagesTotalType).type == "success") {
                    setImagesData((imagesTotal.value as imagesTotalType).data.slice(startIndex, endIndex))
                } else {
                    setImagesData((imagesTotal.value as UploadLogType[]).slice(startIndex, endIndex))
                }
                sortData(selectedSortType.value); // 本地加载完后排序
            } else {
                loadNetworkImages(newPage).then(() => {
                    sortData(selectedSortType.value);
                });
            }
        });
    };

    const pageSizeChange = () => {
        if (loadingMode.value == "local") {
            pageChange(page.value)
        } else {
            message.error("网络加载模式下，暂不支持修改每页数量");
            setPageSize((imagesTotal.value as imagesTotalType).pageSize || 10)
            return;
        }
    };

    const getTotalPages = () => {
        let Total;
        if (loadingMode.value === 'local') {
            Total = Math.ceil((imagesTotal.value as UploadLogType[]).length / pageSize.value);
        } else {
            Total = Math.ceil((imagesTotal.value as imagesTotalType).total / pageSize.value);
        }
        return Total || 1
    };

    return {
        pageChange,
        pageSizeChange,
        getTotalPages
    };
}
