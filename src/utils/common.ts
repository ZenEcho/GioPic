export const COPY_FORMATS = ['url', 'html', 'bbcode', 'markdown', 'MD with link'] as const

export const FORMAT_LABELS: Record<string, string> = {
    url: 'URL',
    html: 'HTML',
    bbcode: 'BBCode',
    markdown: 'Markdown',
    'MD with link': 'MD+Link',
    thumbUrl: 'Thumb'
}

export function formatLink(url: string, format: string, thumbUrl?: string): string {
    switch (format) {
        case 'html': return `<img src="${url}" alt="image" />`
        case 'bbcode': return `[img]${url}[/img]`
        case 'markdown': return `![](${url})`
        case 'MD with link': return `[![](${url})](${url})`
        case 'thumbUrl': return thumbUrl || url
        default: return url
    }
}

export async function copyToClipboard(text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text)
    } catch (err) {
        console.error('Failed to copy: ', err)
        throw err
    }
}
