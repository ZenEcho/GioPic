// Helper: Download image from URL as File
export async function downloadImage(url: string): Promise<File> {
    const res = await fetch(url)
    const blob = await res.blob()

    // 1. Try to get filename from URL
    let filename = url.split('/').pop()?.split('?')[0] || ''
    
    // 2. Decode filename (handle URL encoding)
    try {
        filename = decodeURIComponent(filename)
    } catch (e) {
        // ignore error
    }

    // 3. Detect mime type
    const mimeType = blob.type || 'image/png'
    const extFromMime = mimeType.split('/')[1]?.split('+')[0] || 'png'
    
    // 4. Check if filename has valid extension
    const hasExtension = /\.[a-zA-Z0-9]{2,5}$/.test(filename)
    
    if (!filename || !hasExtension) {
        // Generate new filename if missing or invalid extension
        const timestamp = new Date().toISOString().replace(/[-:.]/g, '')
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        filename = `giopic_${timestamp}_${random}.${extFromMime}`
    } else {
        // Ensure extension matches mime type if possible
        const currentExt = filename.split('.').pop()?.toLowerCase()
        if (currentExt !== extFromMime && extFromMime !== 'octet-stream') {
             if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff'].includes(currentExt || '')) {
                 filename += `.${extFromMime}`
             }
        }
    }
    return new File([blob], filename, { type: blob.type })
}
