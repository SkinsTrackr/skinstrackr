import { FC, Dispatch, SetStateAction, useState } from 'react'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { cn } from '@/lib/utils'
import { ArrowRightLeft, ChevronDown, PackageMinus, PackagePlus } from 'lucide-react'
import { TransferItems } from '@shared/interfaces/inventory.types'
import { IconWrapper } from './ui/icon-wrapper'

interface TransferMenuProps {
  transfer: TransferItems
  setTransfer: Dispatch<SetStateAction<TransferItems>>
}

export const TransferMenu: FC<TransferMenuProps> = ({ transfer, setTransfer }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  //   return transfer.mode === null ? (
  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            'h-auto flex-col gap-1 w-[110px] transition-all shadow-sm',
            'border-yellow-500/50 text-yellow-600 dark:text-yellow-500',
            'hover:bg-yellow-500/10 hover:border-yellow-500',
            'hover:shadow-md'
          )}
          variant="outline"
        >
          <div className="flex items-center gap-1.5">
            {transfer.mode === null ? (
              <IconWrapper size="md" variant="solid">
                <ArrowRightLeft />
              </IconWrapper>
            ) : transfer.mode === 'toInventory' ? (
              <IconWrapper size="md" variant="solid">
                <PackageMinus />
              </IconWrapper>
            ) : (
              <IconWrapper size="md" variant="solid">
                <PackagePlus />
              </IconWrapper>
            )}
            <span className="text-sm font-semibold">
              {transfer.mode === null ? 'Transfer' : transfer.mode === 'toInventory' ? 'Retrieve' : 'Insert'}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 opacity-50" strokeWidth={2.5} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-2 h-auto py-2.5 px-3',
              'hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-500',
              'transition-all'
            )}
            onClick={() => {
              setTransfer({ ...transfer, mode: 'toInventory' })
              setIsPopoverOpen(false)
            }}
          >
            <IconWrapper size="md" variant="solid">
              <PackageMinus />
            </IconWrapper>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold">Retrieve</span>
              <span className="text-xs text-muted-foreground">Move items from containers</span>
            </div>
          </Button>
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-2 h-auto py-2.5 px-3',
              'hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-500',
              'transition-all'
            )}
            onClick={() => {
              setTransfer({ ...transfer, mode: 'toContainer' })
              setIsPopoverOpen(false)
            }}
          >
            <IconWrapper size="md" variant="solid">
              <PackagePlus />
            </IconWrapper>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold">Insert</span>
              <span className="text-xs text-muted-foreground">Store items in container</span>
            </div>
          </Button>
          {transfer.mode !== null && (
            <>
              <div className="border-t my-1" />
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-center gap-2 h-auto py-2 px-3',
                  'hover:bg-destructive/10 hover:text-destructive',
                  'transition-all text-muted-foreground'
                )}
                onClick={() => {
                  setTransfer({ ...transfer, mode: null, selectedItems: {} })
                  setIsPopoverOpen(false)
                }}
              >
                <span className="text-xs font-medium">Exit Transfer Mode</span>
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
