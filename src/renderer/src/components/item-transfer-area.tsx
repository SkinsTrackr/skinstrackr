import { FC } from 'react'
import { Card, CardContent } from './ui/card'
import { TransferItems } from '@shared/interfaces/inventory.types'

const colorYellowOpaque = 'rgba(234, 179, 8, 0.1)'

const getTransferAreaStyle = () => ({
  className: 'rounded-lg relative p-4 border-2 border-yellow-500 mb-4',
  style: {
    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, ${colorYellowOpaque} 8px, ${colorYellowOpaque} 16px)`,
    borderStyle: 'dashed'
  } as React.CSSProperties
})

interface ItemTransferAreaProps {
  transfer: TransferItems
}

export const ItemTransferArea: FC<ItemTransferAreaProps> = ({ transfer }) => {
  return (
    <>
      {transfer.mode !== null && (
        <div {...getTransferAreaStyle()}>
          <Card className="opacity-80">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-500">
                  {transfer.mode === 'toInventory' ? 'Transferring to Inventory' : 'Transferring to Container'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {transfer.mode === 'toInventory' ? 'Select items below' : 'Select items below'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
