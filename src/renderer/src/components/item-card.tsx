import { ConvertedItem, Rarity } from '@shared/interfaces/inventory.types'
import { FC } from 'react'
import { Card, CardContent } from './ui/card'

interface ItemCardProps {
  items: ConvertedItem[]
  name: string
  rarity?: Rarity
}

export const ItemCard: FC<ItemCardProps> = ({ items, name, rarity }) => {
  return (
    <Card className="cursor-pointer hover:bg-accent transition-colors relative overflow-hidden py-4">
      {/* Count Badge */}
      {items.length > 1 && (
        <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-md px-1.5 py-0.5 text-[10px] font-bold z-10 min-w-[20px] text-center">
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
        </div>

        {/* Content Area */}
        <div className="flex flex-col justify-between h-full flex-1 min-w-0">
          {/* Item Name */}
          <div className="text-left w-full">
            <span className="text-xs font-medium leading-tight line-clamp-2 break-words">{name || 'Unknown Item'}</span>
          </div>

          {/* Bottom Row: Rarity Bar and Price */}
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
                <span className="text-xs font-semibold text-green-500 dark:text-green-500">
                  ${(items[0].price * items.length).toFixed(2)}
                </span>
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
