import { h } from 'vue';
const fileTypeMap: { [key: string]: string } = {
    '.zip': 'compressedfile',
    '.zipx': 'compressedfile',
    '.rar': 'compressedfile',
    '.7z': 'compressedfile',
    '.alz': 'compressedfile',
    '.egg': 'compressedfile',
    '.cab': 'compressedfile',
    '.hb': 'compressedfile',
    '.001': 'compressedfile',
    '.arj': 'compressedfile',
    '.lha': 'compressedfile',
    '.lzh': 'compressedfile',
    '.pma': 'compressedfile',
    '.ace': 'compressedfile',
    '.arc': 'compressedfile',
    '.aes': 'compressedfile',
    '.zpaq': 'compressedfile',
    '.zstd': 'compressedfile',
    '.br': 'compressedfile',
    '.pea': 'compressedfile',
    '.tar': 'compressedfile',
    '.gz': 'compressedfile',
    '.tgz': 'compressedfile',
    '.bz': 'compressedfile',
    '.bz2': 'compressedfile',
    '.tbz': 'compressedfile',
    '.tbz2': 'compressedfile',
    '.xz': 'compressedfile',
    '.txz': 'compressedfile',
    '.lzma': 'compressedfile',
    '.tlz': 'compressedfile',
    '.lz': 'compressedfile',
    '.uu': 'compressedfile',
    '.uue': 'compressedfile',
    '.xxe': 'compressedfile',
    '.z': 'compressedfile',
    '.jar': 'jar',
    '.war': 'war',
    '.apk': 'apk',
    '.ipa': 'ipa',
    '.xpi': 'xpi',
    '.deb': 'deb',
    '.asar': 'asar',
    '.iso': 'iso',
    '.img': 'img',
    '.isz': 'isz',
    '.link': 'link',
    '.ink': 'link',
    '.udf': 'udf',
    '.wim': 'wim',
    '.bin': 'bin',
    //图片后缀
    '.jpg': 'image',
    '.jpeg': 'image',
    '.png': 'image',
    '.gif': 'image',
    '.bmp': 'image',
    '.ico': 'image',
    '.icns': 'image',
    '.webp': 'image',
    '.raw': 'image',
    '.heic': 'image',
    '.heif': 'image',
    '.tif': 'print',
    '.tiff': 'print',
    '.svg': 'svg',
    '.cr2': 'cr2',
    '.nef': 'nef',
    '.dng': 'dng',
    //office后缀
    '.doc': 'word',
    '.docx': 'word',
    '.docm': 'word',
    '.dotx': 'word',
    '.dotm': 'word',
    '.xls': 'excel',
    '.xlsx': 'excel',
    '.xlsm': 'excel',
    '.xltx': 'excel',
    '.xltm': 'excel',
    '.xlsb': 'excel',
    '.xlam': 'excel',
    '.xlt': 'excel',
    '.ppt': 'powerPoint',
    '.pptx': 'powerPoint',
    '.pptm': 'powerPoint',
    '.ppsx': 'powerPoint',
    '.ppsm': 'powerPoint',
    '.potx': 'powerPoint',
    '.potm': 'powerPoint',
    '.ppam': 'powerPoint',
    '.pps': 'powerPoint',
    //adobe
    '.ai': 'ai',
    '.pdf': 'Acrobat',
    '.psd': 'ps',
    '.prproj': 'pr',
    '.aep': 'ae',
    //win系统后缀
    '.exe': 'exe',
    '.dll': 'dll',
    '.sys': 'sys',
    '.bat': 'editable',
    '.reg': 'reg',
    '.txt': 'editable',

    //媒体后缀
    '.mp3': 'music',
    '.mp4': 'video',
    '.avi': 'video',
    '.mov': 'video',
    '.wmv': 'video',
    '.flv': 'video',
    '.rmvb': 'video',
    '.rm': 'video',
    '.asf': 'video',
    '.mkv': 'video',
    '.mpg': 'video',
    '.mpeg': 'video',
    '.m4v': 'video',
    '.3gp': 'video',
    '.3gpp': 'video',
    '.3gpp2': 'video',
    '.asx': 'video',
    '.wma': 'video',
    '.c': 'editable',
    '.cpp': 'editable',
    '.java': 'editable',
    '.py': 'editable',
    '.js': 'editable',
    '.html': 'editable',
    '.css': 'editable',
    '.php': 'editable',
    '.asp': 'editable',
    '.json': 'editable',
    '.sh': 'editable',
    '.pl': 'editable',
    '.h': 'editable',
    '.hpp': 'editable',
    '.md': 'editable',
    '.sql': 'editable',
    '.log': 'editable',
    '.conf': 'editable',
    '.cfg': 'editable',
    '.ini': 'editable',
    '.rst': 'editable',
    '.csv': 'editable',
    '.tsv': 'editable',
    '.vue': 'editable',
    '.ts': 'editable',
    '.xml': 'editable',
    '.yaml': 'editable',
    '.yml': 'editable',
    '.toml': 'editable',
};
export const sortOptions = [
    { label: '时间最新', value: 'newest' },
    { label: '时间最旧', value: 'oldest' },
    { label: '文件最大', value: 'largest' },
    { label: '文件最小', value: 'smallest' },
    { label: '字母顺序', value: 'name' }
];

/**
 * 根据提供的链接渲染图标。
 *
 * @param link - 要渲染为图标的 URL 或 SVG 字符串。可以是：
 *   - 以 'http://' 或 'https://' 开头的 URL
 *   - 以 '.svg' 结尾的 URL
 *   - 以 '<svg' 开头的内联 SVG 字符串
 *   - 用于 div 元素的类名
 * @returns 返回一个函数，该函数返回表示图标的 VNode。
 */
export function renderIcon(link: string) {
    if (link.startsWith('http://') || link.startsWith('https://') || link.endsWith('.svg')) {
        return () => h('img', { src: link, class: 'w-6 h-6' });
    } else if (link.startsWith('<svg')) {
        return () => h('div', { innerHTML: link, class: 'w-6 h-6' });
    } else {
        return () => h('div', { class: `${link}` });
    }
}

export const urlType = [
    { key: 'URL', label: 'URL' },
    { key: 'HTML', label: 'HTML' },
    { key: 'BBCode', label: 'BBCode' },
    { key: 'Markdown', label: 'Markdown' },
    { key: 'MDWithLink', label: 'MD with link' }
];
/**
 * 生成不同格式的链接或图像标记。
 * @param {String} mode - 生成链接的模式，可选值为 'URL', 'HTML', 'BBCode', 'Markdown', 'MDWithLink'。
 * @param {String} src - 图片的源 URL。
 * @param {String} name - 图片的名称或 alt 文本（仅在某些模式下使用）。
 * @returns {String} - 返回根据模式生成的链接或图像标记。
 */
export function generateLink(mode: string, src: string, name: string): string {
    const linkFormats: { [key: string]: string } = {
        'URL': src,
        'HTML': `<img src="${src}" alt="${name}" title="${name}">`,
        'BBCode': `[img]${src}[/img]`,
        'Markdown': `![${name}](${src})`,
        'MDWithLink': `[![${name}](${src})](${src})`,
    };

    return linkFormats[mode] || linkFormats['URL'];
}
export async function copyText(value: string): Promise<{ message: string; type: string }> {
    try {
        await navigator.clipboard.writeText(value);
        return { message: "复制成功！", type: "success" };
    } catch (error: unknown) {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            const result = document.execCommand('copy');
            document.body.removeChild(textArea);
            return result 
                ? { message: "复制成功！", type: "success" }
                : { message: "复制失败,请手动复制！", type: "error" };
        } catch (err) {
            document.body.removeChild(textArea);
            console.error(err);
            return { message: "复制失败,请手动复制！", type: "error" };
        }
    }
}


/**
 * 根据传值计算文件大小和单位
 * @param {String} size - 文件大小
 * @returns {String} - 返回计算后的文件大小和单位
 */
export function getFormatFileSize(size: string | number): string {
    if (typeof size !== 'number') {
        size = Number(size);
    }
    if (isNaN(size)) {
        return 'Invalid size';
    }
    const units = ["byte", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB", "BB", "NB", "DB", "CB", "XB", "?B"];
    let index = 0;
    while (size >= 1024 && index < units.length - 1) {
        size /= 1024;
        index++;
    }
    return size.toFixed(2) + units[index];
}

export function getFileType(extension: string): string {
    const lowerCaseExtension = extension.toLowerCase();
    return fileTypeMap[lowerCaseExtension as keyof typeof fileTypeMap] || 'none';
}


export function insertSubdomain(url: string, subdomain: string) {
    const host = new URL(url).host
    return url.replace(host, `${subdomain}.${host}`)
}
export function wrapUrl(url: string, https?: boolean) {
    if (!url)
        return ''
    if (!/^https?:/.test(url))
        url = `${https ? 'https' : 'http'}://${url}`
    return ensureEndWith(url, '/')
}
export function ensureEndWith(str: string, end: string) {
    return str.endsWith(end) ? str : `${str}${end}`
}