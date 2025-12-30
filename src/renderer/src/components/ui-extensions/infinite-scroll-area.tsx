import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { cn } from '@/lib/utils'
import { ScrollBar } from '@/components/ui/scroll-area'

interface InfiniteScrollAreaProps extends Omit<React.ComponentProps<typeof ScrollAreaPrimitive.Root>, 'children'> {
  totalItems: number
  initialCount?: number
  increment?: number
  threshold?: number
  resetDependencies?: React.DependencyList
  children: (displayCount: number) => React.ReactNode
}

function InfiniteScrollArea({
  className,
  totalItems,
  initialCount = 50,
  increment = 50,
  threshold = 200,
  resetDependencies = [],
  children,
  ...props
}: InfiniteScrollAreaProps): React.JSX.Element {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const loadingRef = React.useRef(false)
  const [displayCount, setDisplayCount] = React.useState(initialCount)

  // Reset display count and scroll to top when dependencies change
  React.useEffect(() => {
    setDisplayCount(initialCount)
    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDependencies)

  const handleScroll = React.useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport || displayCount >= totalItems || loadingRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = viewport
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    if (distanceFromBottom < threshold) {
      loadingRef.current = true
      setDisplayCount((prev) => Math.min(prev + increment, totalItems))
      // Reset loading flag after a short delay
      setTimeout(() => {
        loadingRef.current = false
      }, 100)
    }
  }, [displayCount, totalItems, increment, threshold])

  return (
    <ScrollAreaPrimitive.Root data-slot="scroll-area" className={cn('relative', className)} {...props}>
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        onScroll={handleScroll}
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {children(displayCount)}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

export { InfiniteScrollArea }
