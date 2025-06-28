import type { AxiosRequestConfig } from 'axios';


export interface hellohao_ImagesListResponseType {
    imgurl: string;  // 图片的 URL
    sizes: number;  // 图片大小
    abnormal: string;  // 异常信息（例如：服务器 IP 地址）
    updatetime: string;  // 图片的更新时间（日期字符串）
    username: string;  // 上传者用户名
    md5key: string;  // 图片的 MD5 校验值
    imguid: string;  // 图片的唯一标识符
}

// 上传类型
export interface hellohao_UploadParams extends AxiosRequestConfig {
    host: string;        // 主机地址
    fullURL: boolean;    // 是否使用完整URL
    token: string;       // 认证token
    source: string;      // 存储源
    paramName?: string;  // 文件字段名称（可选，默认'file'）
    acceptedFiles?: string; // 接受文件类型（可选，默认'image/*'）
    
}
