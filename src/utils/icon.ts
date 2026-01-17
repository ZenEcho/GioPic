
/**
 * 获取存储类型对应的图标类名
 * @param type 存储类型字符串
 * @returns 图标类名
 */
export function getStorageIcon(type: string | undefined): string {
    if (!type) {
        return 'i-ph-hard-drive'
    }

    const icons: Record<string, string> = {
        'lsky': 'i-ph-image',
        'easyimages': 'i-ph-image',
        'chevereto': 'i-ph-image',
        'imgurl': 'i-ph-image',
        'aliyun': 'i-ph-cloud',
        'aws': 'i-ph-amazon-logo',
        'tencent': 'i-ph-cloud',
        'smms': 'i-ph-image',
        'hellohao': 'i-ph-image',
        'imgur': 'i-ph-image',
        'custom': 'i-ph-image',
        'github': 'i-ph-github-logo',

    }

    return icons[type.toLowerCase()] || 'i-ph-hard-drive'
}
