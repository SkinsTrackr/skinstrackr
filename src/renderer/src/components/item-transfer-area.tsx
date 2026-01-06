import { FC, useEffect, useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { ConvertedContainer, TransferItems } from '@shared/interfaces/inventory.types'
import { ArrowRightLeft } from 'lucide-react'
import { useInventory } from '@/contexts/InventoryContext'
import { showToast } from './toast'
import { cn } from '@/lib/utils'
import { getCleanErrorMessage } from '@/lib/error-utils'

const getTransferAreaStyle = (): {
  className: string
  style: React.CSSProperties
} => ({
  className: 'sticky top-0 z-50 mb-2',
  style: {}
})

interface ItemTransferAreaProps {
  transfer: TransferItems
  containers: ConvertedContainer[]
  setTransfer: React.Dispatch<React.SetStateAction<TransferItems>>
}

export const ItemTransferArea: FC<ItemTransferAreaProps> = ({ transfer, containers, setTransfer }) => {
  const allSelectedItems = Object.values(transfer.selectedItems || {}).flat()
  const maxCapacity = 1000
  const currentContainerCount =
    containers.filter((container) => container.id === transfer.toContainerId)[0]?.items.length || 0
  const availableSpace = maxCapacity - currentContainerCount
  const inventory = useInventory()
  const [transferredCount, setTransferredCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [isTransferring, setIsTransferring] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    const unsubscribe = window.api.onTransferProgress((itemId, success) => {
      console.log(`Transfer progress for item ${itemId}: ${success ? 'Success' : 'Failure'}`)

      if (success) {
        setTransferredCount((prev) => prev + 1)
      } else {
        setFailedCount((prev) => prev + 1)
      }
    })

    return unsubscribe
  }, [isTransferring])

  const handleTransfer = async (): Promise<void> => {
    if (allSelectedItems.length === 0) {
      return
    }

    console.log('Initiating transfer for items:', allSelectedItems)
    setIsTransferring(true)
    setTransferredCount(0)
    setFailedCount(0)

    try {
      await window.api.transferItems(transfer)
      await inventory.loadInventory(false, true)
    } catch (error) {
      console.log(error)
      showToast(getCleanErrorMessage(error), 'error')
    } finally {
      // Reset selected items after successful transfer
      setTransfer((prev) => ({
        ...prev,
        selectedItems: {}
      }))
      setIsTransferring(false)
      if (isCancelling) {
        setIsCancelling(false)
        showToast('Transfer cancelled', 'info')
      }
    }
  }

  const handleCancel = async (): Promise<void> => {
    try {
      setIsCancelling(true)
      await window.api.cancelTransfer()
    } catch (error) {
      console.log(error)
      showToast(String(error), 'error')
    }
  }

  const handleReset = (): void => {
    setTransfer((prev) => ({
      ...prev,
      selectedItems: {}
    }))
    setTransferredCount(0)
    setFailedCount(0)
  }

  const progressPercentage = isTransferring ? Math.round((transferredCount / allSelectedItems.length) * 100) : 0

  return (
    <>
      {/* Full-screen overlay to block interaction while transferring */}
      {isTransferring && <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 cursor-wait" />}

      {transfer.mode !== null && (
        <div {...getTransferAreaStyle()}>
          <Card className="border-2 border-yellow-500/50 shadow-sm backdrop-blur-sm relative z-50">
            <CardContent className="p-3">
              <div className="space-y-2.5">
                {/* Stats and Progress Combined */}
                <div className="flex items-center gap-2.5">
                  {/* Progress */}
                  <div className="flex-1 space-y-1.5">
                    {/* Counter and status */}
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide">
                          Transferred
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={cn(
                              'text-lg font-bold tabular-nums',
                              isTransferring ? 'text-yellow-600 dark:text-yellow-500' : 'text-muted-foreground/60'
                            )}
                          >
                            {transferredCount}
                          </span>
                          <span className="text-muted-foreground/40 font-medium">/</span>
                          <span
                            className={cn(
                              'text-lg font-bold tabular-nums',
                              failedCount > 0 ? 'text-red-600 dark:text-red-500' : 'text-muted-foreground/60'
                            )}
                          >
                            {failedCount}
                          </span>
                        </div>
                      </div>

                      <div className="h-8 w-px bg-border" />

                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide">
                          Selected
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold tabular-nums text-yellow-600 dark:text-yellow-500">
                            {allSelectedItems.length}
                          </span>
                          <span className="text-muted-foreground/40 font-medium">/</span>
                          <span className="text-lg font-bold tabular-nums text-muted-foreground/60">
                            {availableSpace}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/30">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500 ease-out',
                          isTransferring
                            ? 'bg-gradient-to-r from-yellow-500 via-yellow-500 to-yellow-600'
                            : 'bg-yellow-500/30'
                        )}
                        style={{ width: `${progressPercentage}%` }}
                      >
                        {isTransferring && progressPercentage > 0 && (
                          <div className="h-full w-full animate-pulse bg-white/20" />
                        )}
                      </div>
                    </div>

                    {/* Helper text */}
                    {!isTransferring && (
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground/60 italic">Select items to transfer</span>
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTransfer}
                      disabled={
                        isTransferring ||
                        allSelectedItems.length === 0 ||
                        transfer.fromContainerIds.length === 0 ||
                        transfer.toContainerId === -1
                      }
                      className={cn(
                        'h-8 px-3 gap-1.5 font-semibold transition-all',
                        'border-yellow-500/50 text-yellow-600 dark:text-yellow-500',
                        'hover:bg-yellow-500/10 hover:border-yellow-500',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'shadow-sm hover:shadow-md',
                        isTransferring && 'cursor-wait'
                      )}
                    >
                      <ArrowRightLeft className={cn('h-3.5 w-3.5', isTransferring && 'animate-pulse')} />
                      <span className="text-sm">Transfer</span>
                    </Button>

                    {isTransferring ? (
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        size="sm"
                        className={cn(
                          'h-8 px-3 font-semibold transition-all',
                          'border-red-500/50 text-red-600 dark:text-red-400',
                          'hover:bg-red-500/10 hover:border-red-500',
                          'shadow-sm hover:shadow-md'
                        )}
                      >
                        <span className="text-sm">Cancel</span>
                      </Button>
                    ) : (
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        size="sm"
                        disabled={isTransferring}
                        className={cn(
                          'h-8 px-3 font-semibold transition-all',
                          'hover:bg-muted/50',
                          'shadow-sm hover:shadow-md'
                        )}
                      >
                        <span className="text-sm">Reset</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
