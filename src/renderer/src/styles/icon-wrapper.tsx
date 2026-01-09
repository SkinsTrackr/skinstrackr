import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const iconWrapperVariants = cva('flex items-center justify-center [&>svg]:!w-[50%] [&>svg]:!h-[50%]', {
  variants: {
    variant: {
      gradient:
        'bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500',
      solid: 'bg-yellow-600/10 text-yellow-600 dark:text-yellow-500'
    },
    size: {
      md: 'w-8 h-8 rounded-md',
      lg: 'w-10 h-10 rounded-md',
      xl: 'w-14 h-14 rounded-xl'
    }
  },
  defaultVariants: {
    variant: 'gradient',
    size: 'xl'
  }
})

export interface IconWrapperProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof iconWrapperVariants> {}

function IconWrapper({ className, variant, size, ...props }: IconWrapperProps): React.JSX.Element {
  return <div data-slot="icon-wrapper" className={cn(iconWrapperVariants({ variant, size }), className)} {...props} />
}

export { IconWrapper, iconWrapperVariants }
