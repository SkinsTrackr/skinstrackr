import { ConvertedItem, Rarity, TransferItems } from '@shared/interfaces/inventory.types'
import { FC, useRef, useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'

interface ItemCardProps {
  items: ConvertedItem[]
  name: string
  rarity?: Rarity
  transfer: TransferItems
  setTransfer: React.Dispatch<React.SetStateAction<TransferItems>>
  containers: Record<number, ConvertedItem[]>
}

export const ItemCard: FC<ItemCardProps> = ({ items, name, rarity, transfer, setTransfer, containers }) => {
  const [transferAmount, setTransferAmount] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleTransferAmount = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    // Only allow positive integers, cap at items.length or max container items
    if (value === '' || /^\d+$/.test(value)) {
      const numValue = value === '' ? 0 : parseInt(value)
      if (numValue >= 0) {
        const currentCardItemIds = items.map((item) => item.id!)
        const otherItemIds = transfer.itemIds.filter((id) => !currentCardItemIds.includes(id))

        // Cap the value at input value, items.length OR max available container space
        // Only count items from OTHER cards when calculating available space
        const cappedValue = Math.min(
          numValue,
          items.length,
          1000 - (containers[transfer.toContainerId]?.length || 0) - otherItemIds.length
        )

        setTransfer((prev) => {
          if (cappedValue > 0) {
            // Add the selected items from this card
            const selectedItemIds = items.slice(0, cappedValue).map((item) => item.id!)
            return { ...prev, itemIds: [...otherItemIds, ...selectedItemIds] }
          } else {
            // Remove all items from this card
            return { ...prev, itemIds: otherItemIds }
          }
        })
        setTransferAmount(cappedValue.toString())
      }
    }
  }

  // Reset the transfer amount input when target container changes
  //   useMemo(() => {
  //     setTransferAmount('')
  //   }, [transfer.toContainerId])

  const handleCardClick = (): void => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }

  return (
    <Card
      className="cursor-pointer hover:bg-accent hover:scale-105 hover:shadow-lg transition-all duration-200 relative overflow-hidden py-4"
      onClick={handleCardClick}
    >
      {/* Count Badge */}
      {items.length > 1 && (
        <div className="absolute top-1 left-3 bg-primary text-primary-foreground rounded-md px-2 py-0.5 text-xs font-semibold z-10 min-w-[20px] text-center shadow-sm">
          {items.length}
        </div>
      )}
      <CardContent className="flex items-center gap-3 px-2 py-1 h-20">
        {/* Item Icon */}
        <div className="relative w-18 h-18 flex-shrink-0 flex items-center justify-center">
          <img
            src={window.env.ICONS_BASE_URL + '/' + (items[0].imagePath || '') + '.png'}
            alt={name || 'Unknown Item'}
            className="max-w-full max-h-full object-contain"
          />

          {/* Transfer Input - Bottom of Image */}
          <div className="absolute -bottom-4 left-6 -translate-x-1/2 z-20">
            <Input
              ref={inputRef}
              type="text"
              value={transferAmount}
              onChange={handleTransferAmount}
              placeholder="-"
              className="w-14 h-6 px-2 py-0.5 text-xs font-semibold text-center bg-secondary text-secondary-foreground border-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md shadow-sm transition-all"
              onClick={(e): void => e.stopPropagation()}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-col justify-between h-full flex-1 min-w-0">
          {/* Item Name */}
          <div className="text-left w-full">
            <span className="text-xs font-medium leading-tight line-clamp-2 break-words">{name || 'Unknown Item'}</span>
          </div>

          {/* Rarity Bar and Price */}
          <div className="flex flex-col gap-1 w-full">
            {/* Item Color/Rarity Bar */}
            {rarity?.color !== null && (
              <div
                className="w-full h-1 rounded-full"
                style={{
                  backgroundColor: rarity?.color || '#888888'
                }}
              />
            )}

            {/* Item Price */}
            <div className="text-left w-full">
              {items[0].price !== undefined && items[0].price > 0 ? (
                <div>
                  <span className="text-xs font-semibold text-green-500 dark:text-green-500">
                    ${items[0].price.toFixed(2)}
                  </span>
                  {items.length > 1 ? (
                    <span className="text-xs font-semibold text-green-700">
                      {items.length > 1 ? ` | $${(items[0].price * items.length).toFixed(2)}` : ''}
                    </span>
                  ) : undefined}
                </div>
              ) : items[0].tradable ? (
                <span className="text-xs text-muted-foreground">No Price</span>
              ) : (
                <span className="text-xs text-muted-foreground">N/A</span>
              )}
            </div>
          </div>
        </div>

        {/* Float value placeholder - can be implemented when float data is available */}
        {/* {item.float && (
                    <span className="text-xs text-muted-foreground">
                      Float: {item.float.toFixed(4)}
                    </span>
                  )} */}
      </CardContent>
    </Card>
  )
}
