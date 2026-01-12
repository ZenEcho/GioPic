import { ref, type Ref, onMounted, onUnmounted, watch } from 'vue'

export interface Position {
    x: number
    y: number
}

export function useDraggable(
    targetEl: Ref<HTMLElement | null>,
    handleEl: Ref<HTMLElement | null>,
    initialPosition: Position = { x: 0, y: 0 }
) {
    const isDragging = ref(false)
    const position = ref<Position>(initialPosition)
    
    let startX = 0
    let startY = 0
    let startLeft = 0
    let startTop = 0

    const handleMouseDown = (e: MouseEvent) => {
        if (!targetEl.value) return
        
        // Ignore interactive elements
        const target = e.target as HTMLElement
        if (target.closest('input, select, button, textarea, a')) {
            return
        }
        
        // Prevent default to avoid text selection
        e.preventDefault()
        
        isDragging.value = true
        startX = e.clientX
        startY = e.clientY
        
        // Get current position
        const rect = targetEl.value.getBoundingClientRect()
        startLeft = rect.left
        startTop = rect.top
        
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        
        if (handleEl.value) {
            handleEl.value.style.cursor = 'grabbing'
        }
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.value) return
        
        const deltaX = e.clientX - startX
        const deltaY = e.clientY - startY
        
        // Calculate new position
        let newLeft = startLeft + deltaX
        let newTop = startTop + deltaY
        
        // Optional: Constraints (keep within window)
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        const elWidth = targetEl.value?.offsetWidth || 0
        const elHeight = targetEl.value?.offsetHeight || 0
        
        // Simple constraints
        if (newLeft < 0) newLeft = 0
        if (newLeft + elWidth > windowWidth) newLeft = windowWidth - elWidth
        if (newTop < 0) newTop = 0
        if (newTop + elHeight > windowHeight) newTop = windowHeight - elHeight
        
        position.value = {
            x: newLeft,
            y: newTop
        }
    }

    const handleMouseUp = () => {
        isDragging.value = false
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        
        if (handleEl.value) {
            handleEl.value.style.cursor = 'grab'
        }
    }

    const attach = () => {
        if (handleEl.value) {
            handleEl.value.addEventListener('mousedown', handleMouseDown)
            handleEl.value.style.cursor = 'grab'
        }
    }

    const detach = () => {
        if (handleEl.value) {
            handleEl.value.removeEventListener('mousedown', handleMouseDown)
        }
    }

    watch(handleEl, (newVal, oldVal) => {
        if (oldVal) detach()
        if (newVal) attach()
    })

    onMounted(attach)

    onUnmounted(() => {
        detach()
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
    })

    return {
        isDragging,
        position
    }
}
