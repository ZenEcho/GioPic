import { ref, type Ref } from 'vue'

interface SidebarPosition {
    status: boolean
    width: number
    height: number
    location: number
    opacity: number
    closeTime: number
    position: 'Left' | 'Right'
}

export function useSidebarDrag(
    uploadAreaEl: Ref<HTMLElement | null>,
    uploadAreaData: Ref<SidebarPosition | undefined>
) {
    const isDragging = ref(false)
    const isClickPrevented = ref(false)
    const isMouseOverSidebar = ref(false)
    
    // Internal state for drag calculation
    let startY = 0
    let startTop = 0
    let dragTimeout: number | null = null
    let uploadAreaRect: DOMRect | null = null

    const handleMouseDown = (e: MouseEvent) => {
        if (!uploadAreaEl.value) return
        e.preventDefault()
        
        dragTimeout = window.setTimeout(() => {
            isDragging.value = true
            isClickPrevented.value = false
            startY = e.clientY
            startTop = uploadAreaEl.value?.offsetTop || 0
            
            // Add global listeners when drag starts
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }, 200)
    }

    const handleMouseUp = () => {
        if (dragTimeout) {
            clearTimeout(dragTimeout)
            dragTimeout = null
        }
        
        if (isDragging.value) {
            setTimeout(() => {
                isDragging.value = false
                isClickPrevented.value = true // Prevent click after drag
            }, 50)
        } else {
            isClickPrevented.value = false
        }
        
        if (uploadAreaEl.value) {
            uploadAreaEl.value.style.cursor = 'pointer'
        }
        
        // Remove global listeners
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!uploadAreaEl.value || !uploadAreaData.value) return
        
        const el = uploadAreaEl.value
        const position = uploadAreaData.value.position
        
        if (isDragging.value) {
            const deltaY = e.clientY - startY
            const newTop = startTop + deltaY
            const maxTop = window.innerHeight - el.clientHeight
            const clampedTop = Math.max(0, Math.min(newTop, maxTop))

            el.style.top = `${clampedTop}px`
            el.style[position === 'Left' ? 'left' : 'right'] = '0'
            el.style.cursor = 'grabbing'
            
            // Update data model
            const newLocationPercent = (clampedTop / window.innerHeight) * 100
            uploadAreaData.value.location = Math.trunc(newLocationPercent)
            
            return
        }
    }
    
    // Auto-hide/show logic based on mouse position (needs to be called by global mousemove)
    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!uploadAreaEl.value || !uploadAreaData.value) return
        
        // Re-cache rect if needed (simple check)
        if (!uploadAreaRect || Math.random() > 0.95) {
             uploadAreaRect = uploadAreaEl.value.getBoundingClientRect()
        }
        
        const x = e.clientX
        const y = e.clientY
        const w = window.innerWidth
        const position = uploadAreaData.value.position
        const isLeft = position === 'Left'
        
        // Check if near edge
        let isNearSidebar = false
        if (isLeft) {
            isNearSidebar = x <= 50
        } else {
            // Account for scrollbar if needed, roughly
            isNearSidebar = x >= w - 50
        }
        
        const rect = uploadAreaRect
        const isInVerticalRange = y >= rect.top && y <= rect.bottom
        
        if (isNearSidebar && isInVerticalRange) {
            uploadAreaEl.value.style[isLeft ? 'left' : 'right'] = '0'
            isMouseOverSidebar.value = true
        } else {
            isMouseOverSidebar.value = false
        }
        
        if (!isMouseOverSidebar.value && !isDragging.value) {
            const offset = uploadAreaData.value.width + 10
            uploadAreaEl.value.style[isLeft ? 'left' : 'right'] = `-${offset}px`
        }
    }

    return {
        isDragging,
        isClickPrevented,
        handleMouseDown,
        handleMouseUp,
        handleGlobalMouseMove
    }
}
