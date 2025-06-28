export * from './api/';
import type { AxiosRequestConfig, Method, ResponseType } from 'axios';
// 定义ProgramConfiguration类型
export interface ProgramConfigurationType {
    Album?: string | number,
    AppId?: string | number,
    Bucket?: string,
    Cors?: string,
    CorsProxy?: boolean,
    Custom_domain_name?: string,
    Endpoint?: string,
    Expiration?: string,
    Host?: string,
    Nsfw?: string | number,
    Owner?: string,
    Privacy?: string | number,
    Program?: string, // 上传程序
    Region?: string,
    Repository?: string,
    SecretId?: string,
    SecretKey?: string,
    ACL?: string,
    Source?: string | number,
    Storage?: string | number,
    Token?: string,
    Uid?: string | number,
    UploadPath?: string,
    Url?: string,
    authApiKey?: string,
    authPassword?: string,
    authToken?: string,
    authType?: 'none' | 'basic' | 'bearer' | 'apiKey',
    authUsername?: string,
    body?: Array<{
        key: string,
        value: string
    }>,
    bodyType?: string,
    custom_DomainName?: string, // 将 custom_DomainName 设置为可选
    fullURL?: boolean,
    headers?: Array<{
        key: string,
        value: string
    }>,
    imgur_mode?: string,
    keyReplace?: Array<{
        key: string,
        value: string
    }>,
    method?: Method | string;
    params?: Array<{
        key: string,
        value: string
    }>,
    responseAppend?: string,
    responsePath?: string,
    responsePrefix?: string,
    responseType?: ResponseType;
    version?: string | number; // 版本号
    login_type?: 'email' | 'phone' | 'username'; // 登录类型,
    username?: string; // 用户名
    password?: string; // 密码
    remember?: boolean; // 是否记住登录状态
}

export interface ConfigResponse {
    id?: string; // id 字段
    data: ProgramConfigurationType; // data 字段
    ConfigName?: string; // 可选字段
    index?: number; // index 字段
    originalConfigName?: string; // 原始配置名称
    isEditing?: boolean; // 是否正在编辑
}

export interface backgroundSendFileType {
    lastModified?: number,
    name?: string,
    type?: string,
    uploadConfig: ConfigResponse[],
    file: Uint8Array | File | Blob | number[],
    progress: UploadFileProgressType;
    status: UploadFileStatusType;
    uploadPath?: string;
    result?: {
        [key: string]: UploadSuccessInfoType;
    };
}

export interface UploadLogType {
    key: string,
    url: string,
    uploadExe: string,
    upload_domain_name: string,
    original_file_name: string,
    file_size: string | number,
    img_file_size: string | number,
    uploadTime: string | number,
    type?: string;  // 文件类型（通常是 "image"）
    progress?: number;  // 上传进度（0-100）
    NetResponseText?: string;  // 网络响应文本
    NetResponseStatus?: number;  // 网络响应状态码
};
export interface messageType {
    message?: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    error?: unknown;
}
// 删除配置类型
export interface deleteResultType extends messageType {
    key: string;
    filename: string;
}
// 旧版本配置类型
export interface LegacyConfiguration extends ProgramConfigurationType {
    ConfigName?: string;
    ConfigTime?: string;
}

export interface UploadAreaType {
    status: boolean, // 上传区域状态
    width: number, // 上传区域宽度
    height: number, // 上传区域高度
    location: number,
    opacity: number, // 透明度
    closeTime: number, // 关闭时间
    position: string
}
export interface UploadFunctionSettingsType {
    dragUpload: boolean, // 是否开启拖拽上传
    autoInsert: boolean, // 是否开启自动插入
    autoCopy: boolean, // 是否开启自动复制
    rightClickUpload: boolean, // 是否开启右键上传
    imageProxy: string, // 修复 imageProxy 类型
    editBoxPaste: boolean, // 是否开启编辑框粘贴
    openInTab: number, // 是否在新标签打开
    i18n: string, // 语言
}

export interface imagesTotalType {
    data: UploadLogType[];
    page: number;
    pageSize: number;
    total: number;
    type: string;
}
export interface UploadFileStatusType {
    [key: string]: 'pending' | 'uploading' | 'completed' | 'failed';
}
export interface UploadFileProgressType {
    [key: string]: number;
}
export interface UploadFileType {
    id: string;
    file: File;
    thumbnail: string;
    base64: string;
    status: UploadFileStatusType;
    progress: UploadFileProgressType;
    blobURL: string;
    uploadPath?: string;
    result?: {
        [key: string]: UploadSuccessInfoType;
    };
}
export interface UploadSuccessInfoType {
    url: string,
    originalUrl: string,
    name: string,
    message: string,
}

/** 上传基础配置 */
export interface BaseUploadConfigType extends AxiosRequestConfig {
    formData?: (file: File) => FormData;
}

/** 自定义上传扩展接口（例如 S3、COS、OSS 等自定义上传） */
export interface CustomUploadConfigType extends BaseUploadConfigType {
    /** 限制的文件大小（单位：MB） */
    maxFilesize?: number;
    /** 自定义上传方法，内部封装了上传逻辑与进度处理 */
    upload: (fileItem: UploadFileType) => Promise<any>;
}

/** 整体上传策略可能是 axios 方式，也可能是自定义上传 */
export type UploadConfigType = BaseUploadConfigType | CustomUploadConfigType;

/** 定义上传策略工厂类型，可以是同步或异步返回上传配置 */
export type UploadTypeFactoryType = () => UploadConfigType | Promise<UploadConfigType>;