import { PackageOpen } from 'lucide-react'
import { JSX } from 'react'
import { IconWrapper } from './ui/icon-wrapper'

export function InventoryEmptyState(): JSX.Element {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Icon */}
        <IconWrapper>
          <PackageOpen strokeWidth={1.5} />
        </IconWrapper>

        {/* Message */}
        <p className="text-l text-muted-foreground text-center max-w-md">
          No items to show yet, log in with an account to get started
        </p>
      </div>
    </div>
  )
}
