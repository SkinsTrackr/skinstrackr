import { FC } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { ConvertedItem, TransferItems } from '@shared/interfaces/inventory.types'
import { ArrowRightLeft } from 'lucide-react'

const colorYellowOpaque = 'rgba(234, 179, 8, 0.1)'

const getTransferAreaStyle = (): {
  className: string
  style: React.CSSProperties
} => ({
  className: 'rounded-lg relative p-3 border-2 border-yellow-500 mb-4',
  style: {
    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, ${colorYellowOpaque} 8px, ${colorYellowOpaque} 16px)`,
    borderStyle: 'dashed'
  }
})

interface ItemTransferAreaProps {
  transfer: TransferItems
  containers: Record<number, ConvertedItem[]>
  setTransfer: React.Dispatch<React.SetStateAction<TransferItems>>
}

export const ItemTransferArea: FC<ItemTransferAreaProps> = ({ transfer, containers, setTransfer }) => {
  const allSelectedItems = Object.values(transfer.selectedItems || {}).flat()
  const maxCapacity = 1000
  const currentContainerCount = containers[transfer.toContainerId]?.length || 0
  const availableSpace = maxCapacity - currentContainerCount

  const handleReset = (): void => {
    setTransfer((prev) => ({
      ...prev,
      selectedItems: {}
    }))
  }

  return (
    <>
      {transfer.mode !== null && (
        <div {...getTransferAreaStyle()}>
          <Card className="opacity-80">
            <CardContent>
              <div className="text-center">
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-500 mb-3">
                  {transfer.mode === 'toInventory' ? 'Transferring to Inventory' : 'Transferring to Container'}
                </p>
                {/* className={`h-auto self-stretch flex-col !border-yellow-500 !text-yellow-500 !hover:bg-yellow-50 !hover:text-yellow-600`} */}
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="default"
                    className="!border-yellow-500 !text-yellow-500 !hover:bg-yellow-50 !hover:text-yellow-600 flex-col h-auto py-1"
                  >
                    <div className="flex items-center">
                      <ArrowRightLeft className="mr-2" />
                      Transfer {allSelectedItems.length} item{allSelectedItems.length !== 1 ? 's' : ''}
                    </div>
                    <span className="text-xs text-muted-foreground mt-0">Max {availableSpace}</span>
                  </Button>
                  <Button onClick={handleReset} variant="outline" size="default">
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
