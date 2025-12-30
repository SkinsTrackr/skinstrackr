import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DotButtonProps = React.ComponentProps<typeof Button> & {
  showDot?: boolean
}

export function DotButton({ showDot, className, children, ...props }: DotButtonProps): React.JSX.Element {
  return (
    <Button variant="outline" className={cn('relative', className)} {...props}>
      {children}

      {showDot && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-yellow-500" />}
    </Button>
  )
}
