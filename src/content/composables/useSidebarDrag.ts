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
    let uploadAreaRect: DOMRect | null = null

    const handleMouseDown = (e: MouseEvent) => {
        if (!uploadAreaEl.value || !uploadAreaData.value) return
        e.preventDefault()
        
        startY = e.clientY
        startTop = uploadAreaEl.value.offsetTop
        
        // Add global listeners when drag starts
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        
        if (isDragging.value) {
            // Delay resetting isDragging/isClickPrevented slightly to ensure click event sees the prevented state
            setTimeout(() => {
                isDragging.value = false
                isClickPrevented.value = false
            }, 0)
            
            // Sync final position to data
            if (uploadAreaEl.value && uploadAreaData.value) {
                const currentTop = parseInt(uploadAreaEl.value.style.top || '0') || uploadAreaEl.value.offsetTop
                const newLocationPercent = (currentTop / window.innerHeight) * 100
                uploadAreaData.value.location = Math.round(newLocationPercent)
                
                uploadAreaEl.value.style.cursor = 'pointer'
            }
        } else {
            isClickPrevented.value = false
        }
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!uploadAreaEl.value || !uploadAreaData.value) return
        
        const deltaY = e.clientY - startY
        
        // Threshold check to start dragging (5px)
        if (!isDragging.value && Math.abs(deltaY) > 5) {
            isDragging.value = true
            isClickPrevented.value = true
            uploadAreaEl.value.style.cursor = 'grabbing'
        }
        
        if (isDragging.value) {
            const el = uploadAreaEl.value
            const newTop = startTop + deltaY
            const maxTop = window.innerHeight - el.clientHeight
            const clampedTop = Math.max(0, Math.min(newTop, maxTop))

            el.style.top = `${clampedTop}px`
            
            // Keep sidebar visible during drag
            const position = uploadAreaData.value.position
            el.style[position === 'Left' ? 'left' : 'right'] = '0'
        }
    }
    
    // Auto-hide/show logic based on mouse position
    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!uploadAreaEl.value || !uploadAreaData.value || isDragging.value) return
        
        // Optimize: throttle rect calculation or only do it if near edges
        // But for hover detection we need it. 
        // Let's rely on cached rect that updates occasionally or when logic suggests
        
        const x = e.clientX
        const y = e.clientY
        const w = window.innerWidth
        const position = uploadAreaData.value.position
        const isLeft = position === 'Left'
        
        // Check if near edge (activation zone)
        const isNearEdge = isLeft ? x <= 50 : x >= w - 50
        
        if (isNearEdge) {
            // Only query DOM if we are in the activation zone to save performance
            if (!uploadAreaRect || Math.random() > 0.9) {
                 uploadAreaRect = uploadAreaEl.value.getBoundingClientRect()
            }
            
            const rect = uploadAreaRect
            // Check if within vertical range of the sidebar
            const isInVerticalRange = y >= rect.top && y <= rect.bottom
            
            if (isInVerticalRange) {
                uploadAreaEl.value.style[isLeft ? 'left' : 'right'] = '0'
                isMouseOverSidebar.value = true
                return
            }
        }
        
        // If we are not in the activation zone or not in vertical range:
        // Check if we are physically hovering the element (in case it's already open)
        // Actually the `isNearEdge` check might fail if the sidebar is already expanded (width > 50).
        // Let's use a simpler logic:
        
        // If mouse is OVER the element (expanded or not), show it.
        // If mouse is NOT over the element, hide it (unless it's just near the edge trigger).
        
        // However, "mouseover" event on the element itself is better for keeping it open.
        // But the element handles @mouseleave.
        
        // Let's stick to the original logic but cleaned up:
        // 1. If near edge AND within vertical range -> Show
        // 2. Else -> Hide
        
        // We need to know current rect to know vertical range.
        // But rect changes as it moves.
        // We can use uploadAreaData.location to estimate top/bottom without DOM read?
        // top = location%, height = height%
        // faster than getBoundingClientRect
        
        const h = window.innerHeight
        const topPx = (uploadAreaData.value.location / 100) * h
        const heightPx = (uploadAreaData.value.height / 100) * h
        const bottomPx = topPx + heightPx
        
        const isInVerticalRange = y >= topPx && y <= bottomPx
        
        // Trigger zone width
        const triggerWidth = 50
        
        let shouldShow = false
        if (isLeft) {
            shouldShow = x <= triggerWidth && isInVerticalRange
        } else {
            shouldShow = x >= w - triggerWidth && isInVerticalRange
        }
        
        // Also if we are physically hovering the element (handled by CSS/events usually, but here manual)
        // If the element is currently visible (left=0), we should probably keep it visible if mouse is over it.
        // But `handleGlobalMouseMove` runs on document.
        
        if (shouldShow) {
            uploadAreaEl.value.style[isLeft ? 'left' : 'right'] = '0'
            isMouseOverSidebar.value = true
        } else {
            isMouseOverSidebar.value = false
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
