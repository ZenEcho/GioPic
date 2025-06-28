import type { AxiosRequestConfig } from 'axios';


export interface smms_ImagesListResponseType {
    file_id: number;  // 文件 ID
    width: number;  // 图片宽度
    height: number;  // 图片高度
    filename: string;  // 文件名（如：luo.jpg）
    storename: string;  // 存储的文件名（如：D5VpWCKFElUsPcR.jpg）
    size: number;  // 文件大小（字节）
    path: string;  // 文件路径（如：/2019/12/16/D5VpWCKFElUsPcR.jpg）
    hash: string;  // 文件哈希值
    created_at: number;  // 创建时间（Unix 时间戳）
    url: string;  // 图片访问 URL
    delete: string;  // 删除图片的 URL
    page: string;  // 图片页面的 URL
}


// 上传类型
export interface smms_UploadParams extends AxiosRequestConfig {
    url: string
    headers: { Authorization: string };
    paramName: string;
    acceptedFiles: string;
    
}
