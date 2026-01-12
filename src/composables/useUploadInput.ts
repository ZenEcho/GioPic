import { onMounted, onUnmounted } from 'vue'

export function useUploadInput(onFiles: (files: File[]) => void) {
    function onFilesDropped(files: FileList) {
        const fileList: File[] = []
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            if (file) fileList.push(file)
        }
        if (fileList.length) onFiles(fileList)
    }

    function handlePaste(event: ClipboardEvent) {
        const items = event.clipboardData?.items
        if (!items) return

        const fileList: File[] = []
        for (let i = 0; i < items.length; i++) {
            if (items[i]?.type?.indexOf('image') !== -1) {
                const file = items[i]?.getAsFile?.()
                if (file) fileList.push(file)
            }
        }
        if (fileList.length) onFiles(fileList)
    }
    
    onMounted(() => {
        document.addEventListener('paste', handlePaste)
    })
    
    onUnmounted(() => {
        document.removeEventListener('paste', handlePaste)
    })

    return {
        onFilesDropped
    }
}
