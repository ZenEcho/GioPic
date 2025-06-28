import type { AxiosRequestConfig } from 'axios';
interface ImageLinks {
    url: string;
    html: string;
    bbcode: string;
    markdown: string;
    markdown_with_link: string;
    thumbnail_url: string;
    delete_url: string;
}

interface UploadData {
    key: string;
    name: string;
    pathname: string;
    origin_name: string;
    size: string;
    mimetype: string;
    extension: string;
    md5: string;
    sha1: string;
    links: ImageLinks;
}

// 图片列表返回数据
export interface lsky_ImagesListResponseType {
    key: string;
    name: string;
    origin_name: string;
    size: string;  // 数字也可以是字符串类型，取决于需要
    mimetype: string;
    extension: string;
    md5: string;
    sha1: string;
    width: number;
    height: number;
    human_date: string;
    date: string;
    pathname: string;
    links: ImageLinks;
}

// 图片列表返回数据（v2版本）
export interface lskyV2_ImagesListResponseType {
    /**
     * 所在相册列表
     */
    albums: Album[];
    /**
     * 创建时间
     */
    createdAt: string;
    /**
     * 到期时间
     */
    expiredAt: null;
    /**
     * 拓展名
     */
    extension: string;
    /**
     * 文件名
     */
    filename: string;
    /**
     * 所在角色组信息
     */
    group: Group;
    /**
     * 高度
     */
    height: number;
    /**
     * 图片ID
     */
    id: number;
    /**
     * 简介
     */
    intro: string;
    /**
     * 上传ip地址
     */
    ipAddress: string;
    /**
     * 是否公开
     */
    isPublic: boolean;
    /**
     * md5值
     */
    md5: string;
    /**
     * 文件类型
     */
    mimetype: string;
    /**
     * 自定义名称
     */
    name: string;
    /**
     * 文件路径名
     */
    pathname: string;
    /**
     * 原图地址
     */
    publicurl: string;
    /**
     * sha1值
     */
    sha1: string;
    /**
     * 所在储存信息
     */
    storage: Storage;
    /**
     * 标签信息
     */
    tags: Tag[];
    /**
     * 缩略图地址
     */
    thumbnailurl: string;
    /**
     * 宽度
     */
    width: number;
    [property: string]: any;
}

interface Album {
    id: number;
    intro: string;
    name: string;
    [property: string]: any;
}

/**
 * 所在角色组信息
 */
interface Group {
    /**
     * 角色组ID
     */
    id: number;
    /**
     * 角色组简介
     */
    intro: string;
    /**
     * 角色组名称
     */
    name: string;
    [property: string]: any;
}

/**
 * 所在储存信息
 */
interface Storage {
    /**
     * 储存ID
     */
    id: number;
    /**
     * 储存简介
     */
    intro: string;
    /**
     * 储存名称
     */
    name: string;
    /**
     * 储存提供者
     */
    provider: string;
    [property: string]: any;
}

interface Tag {
    id: number;
    name: string;
    [property: string]: any;
}

interface Links {
    first: string;
    last: string;
    next: null;
    prev: null;
    [property: string]: any;
}

interface Meta {
    currentPage: number;
    from: number;
    lastPage: number;
    links: Link[];
    path: string;
    perPage: number;
    to: number;
    total: number;
    [property: string]: any;
}

interface Link {
    active: boolean;
    label: string;
    url: null | string;
    [property: string]: any;
}

// 图片上传返回数据
export interface lsky_UploadResponseType {
    status: boolean;
    message: string;
    data: UploadData;
}
