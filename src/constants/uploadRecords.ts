export const imageMap: Record<string, string> = {
    dir: 'images/fileicon/dir.png',
    ae: 'images/fileicon/ae.png',
    ai: 'images/fileicon/ai.png',
    ar: 'images/fileicon/ar.png',
    asp: 'images/fileicon/asp.png',
    dll: 'images/fileicon/dll.png',
    exe: 'images/fileicon/exe.png',
    link: 'images/fileicon/link.png',
    prproj: 'images/fileicon/pr.png',
    psd: 'images/fileicon/ps.png',
    compressedfile: 'images/fileicon/zip.png',
    word: 'images/fileicon/WORD.png',
    excel: 'images/fileicon/excel.png',
    powerPoint: 'images/fileicon/powerPoint.png',
    null: 'images/fileicon/unknown.png',
    unknown: 'images/fileicon/unknown.png',
    undefined: 'images/fileicon/unknown.png'
};

export const sortOptions: { label: string, value: string }[] = [
    { label: '时间最新', value: 'newest' },
    { label: '时间最旧', value: 'oldest' },
    { label: '文件最大', value: 'largest' },
    { label: '文件最小', value: 'smallest' },
    { label: '字母顺序', value: 'name' }
];

export const pageSizes: { label: string, value: number }[] = [
    { label: '10/页', value: 10 },
    { label: '20/页', value: 20 },
    { label: '30/页', value: 30 },
    { label: '40/页', value: 40 },
    { label: '50/页', value: 50 }
];
