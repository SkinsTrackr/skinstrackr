import { ConvertedContainer, ConvertedItem, Rarity, TransferItems } from '@shared/interfaces/inventory.types'
import { FC, useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { useInventory } from '@/contexts/InventoryContext'
import { showToast } from './toast'
import log from 'electron-log/renderer'

interface ItemCardProps {
  items: ConvertedItem[]
  name: string
  rarity?: Rarity
  transfer: TransferItems
  setTransfer: React.Dispatch<React.SetStateAction<TransferItems>>
  containers: ConvertedContainer[]
}

export const ItemCard: FC<ItemCardProps> = ({ items, name, rarity, transfer, setTransfer, containers }) => {
  const [localInputValue, setLocalInputValue] = useState<string>('')
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { getRawItem } = useInventory()

  // Split up hashName for better display
  const sanitizedName = name
    .replace(/^((?:Souvenir|Sticker|Agent|Patch|Sealed Graffiti|Graffiti|Charm)(?:\s+)?)+/i, '')
    .replace(/Music Kit/gi, '')
    .replace(/StatTrak™/gi, '')
    .replace(/\(Battle-Scarred\)/gi, '')
    .replace(/\(Well-Worn\)/gi, '')
    .replace(/\(Field-Tested\)/gi, '')
    .replace(/\(Minimal Wear\)/gi, '')
    .replace(/\(Factory New\)/gi, '')
    .replace(/^\s*\|\s*/, '') // Remove leading "| " if present
    .replace(/\s{2,}/g, ' ')
    .trim()
  // Show wear condition if present, else show item type
  const wearMatch = name.match(/\b(Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\b/i)
  let secondaryInfo = wearMatch !== null ? wearMatch[0] : items[0].type || ''

  // Special case for Sealed Graffiti items
  if (name.startsWith('Sealed Graffiti')) {
    secondaryInfo = 'Sealed ' + secondaryInfo
  }

  const allSelectedItems = useMemo(() => Object.values(transfer.selectedItems || {}).flat(), [transfer.selectedItems])

  const currentCardItemIds = items.map((item) => item.id!)
  const selectedCount = allSelectedItems.filter((id) => currentCardItemIds.includes(id)).length
  const isSelected = selectedCount > 0

  // Calculate available space in container
  const otherItemIds = allSelectedItems.filter((id) => !currentCardItemIds.includes(id))
  const availableSpace =
    1000 -
    (containers.find((container) => container.id === transfer.toContainerId)?.items.length || 0) -
    otherItemIds.length
  const isDisabled = transfer.mode !== null && !isSelected && availableSpace <= 0

  // Use local input value while typing, otherwise show the actual selected count
  const displayValue = localInputValue !== '' ? localInputValue : selectedCount > 0 ? selectedCount.toString() : ''

  // TODO: Format price based on settings
  const usd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  })

  // Selects items from this card up to the specified amount and updates the state
  // If a card contains items from multiple containers, it will potentially select items from multiple containers
  const selectItemsFromCard = useCallback(
    (amount: number): void => {
      const selectedItems = { ...transfer.selectedItems }
      const newSelectedItems: Record<number, number[]> = {}

      // First only add previously selected items that are NOT from this card
      Object.keys(selectedItems).map((containerIdStr) => {
        const containerId = parseInt(containerIdStr)
        if (newSelectedItems[containerId] === undefined) {
          newSelectedItems[containerId] = []
        }
        newSelectedItems[containerId] = selectedItems[containerId].filter((id) => !currentCardItemIds.includes(id))

        // Remove containers that are empty
        if (newSelectedItems[containerId].length === 0) {
          delete newSelectedItems[containerId]
        }
      })

      // Then add items from this card up to the specified amount
      for (const item of items.slice(0, amount)) {
        const itemId = item.id!
        const containerId = item.containerId!

        if (newSelectedItems[containerId] === undefined) {
          newSelectedItems[containerId] = []
        }
        newSelectedItems[containerId].push(itemId)
      }

      setTransfer((prev) => ({ ...prev, selectedItems: newSelectedItems }))
    },
    [transfer.selectedItems, currentCardItemIds, items, setTransfer]
  )

  // Deselects all items from this card and updates the state
  // If a card contains items from multiple containers, it will remove the item from all those containers
  const deselectItemsFromCard = useCallback((): void => {
    const selectedItems = { ...transfer.selectedItems }

    Object.keys(selectedItems).map((containerIdStr) => {
      const containerId = parseInt(containerIdStr)
      const otherSelectedItems = selectedItems[containerId].filter((id) => !currentCardItemIds.includes(id))

      // Remove items from this card, but keep items from other cards
      if (otherSelectedItems.length > 0) {
        selectedItems[containerId] = otherSelectedItems
      } else {
        delete selectedItems[containerId]
      }
    })

    setTransfer((prev) => ({ ...prev, selectedItems: selectedItems }))
  }, [transfer.selectedItems, currentCardItemIds, setTransfer])

  // Reset local input when transfer mode changes
  useEffect(() => {
    setLocalInputValue('')
  }, [transfer.mode, transfer.toContainerId])

  const handleTransferAmount = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    // Only allow positive integers
    if (value === '' || /^\d+$/.test(value)) {
      const numValue = value === '' ? 0 : parseInt(value)
      if (numValue >= 0) {
        // Cap the value at input value, items.length OR max available container space
        const cappedValue = Math.min(numValue, items.length, availableSpace)

        // Update local input value immediately for responsive UI
        setLocalInputValue(cappedValue > 0 ? cappedValue.toString() : '')

        // Debounce the transfer state update
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current)
        }

        // Update selected amount
        // (delay to minimize state updates while typing)
        updateTimeoutRef.current = setTimeout(() => {
          if (cappedValue > 0) {
            selectItemsFromCard(cappedValue)
          } else {
            deselectItemsFromCard()
          }
        }, 100)
      }
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  const handleCardClick = (): void => {
    if (transfer.mode !== null) {
      //   const containerId = items[0].containerId

      if (items.length === 1) {
        // For single items, toggle selection on click
        if (isSelected) {
          // Deselect the item
          deselectItemsFromCard()
          setLocalInputValue('')
        } else {
          selectItemsFromCard(1)
          setLocalInputValue('1')
        }
      } else {
        // For multiple items, focus the input
        if (!isSelected) {
          handleTransferAmount({ target: { value: items.length.toString() } } as React.ChangeEvent<HTMLInputElement>)

          // Focus and select after setting the value
          setTimeout(() => {
            inputRef.current?.focus()
            inputRef.current?.select()
          }, 0)
        } else {
          // Already selected, just focus and select
          inputRef.current?.focus()
          inputRef.current?.select()
        }
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (transfer.mode === null) return

    // Handle number input for multi-item cards (only when card is focused, not input)
    if (items.length > 1 && /^[0-9]$/.test(e.key) && !isInputFocused) {
      e.preventDefault()

      // Select the card if not already selected
      if (!isSelected) {
        handleTransferAmount({ target: { value: e.key } } as React.ChangeEvent<HTMLInputElement>)
      }

      // Set the input value and focus (without selecting)
      setLocalInputValue(e.key)
      inputRef.current?.focus()
      return
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()

      // For multi-item cards with selection, Enter should deselect
      if (items.length > 1 && isSelected && e.key === 'Enter') {
        deselectItemsFromCard()
        setLocalInputValue('')
      } else {
        handleCardClick()
      }
    }
  }

  const handleDeselectClick = (e: React.MouseEvent): void => {
    e.stopPropagation()

    deselectItemsFromCard()
    setLocalInputValue('')
  }

  const handleCopyItemData = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()

    try {
      const itemId = items[0].id
      if (itemId === undefined) {
        log.error('Item ID is undefined')
        return
      }

      const rawItem = await getRawItem(itemId)
      if (rawItem) {
        await navigator.clipboard.writeText(JSON.stringify(rawItem, null, 2))
        showToast('Item data copied to clipboard', 'success')
      } else {
        log.error('Failed to get raw item data')
        showToast('Failed to get raw item data', 'error')
      }
    } catch (error) {
      log.error('Failed to copy item data:', error)
      showToast('Failed to get raw item data', 'error')
    }
  }

  const handleReportMissingItem = (e: React.MouseEvent): void => {
    e.stopPropagation()

    window.open(window.env.GOOGLE_FORMS_URL, '_blank')
  }

  return (
    <Card
      className={cn(
        'transition-all duration-200 relative overflow-hidden py-[10px]',
        isDisabled && 'opacity-50 cursor-default',
        !isDisabled && transfer.mode !== null && 'cursor-pointer hover:bg-accent hover:shadow-sm',
        !isDisabled && transfer.mode === null && 'cursor-default',
        isSelected && 'ring-2 ring-yellow-500/80 bg-accent shadow-sm backdrop-blur-sm'
      )}
      onClick={isDisabled ? undefined : handleCardClick}
      onKeyDown={isDisabled ? undefined : handleKeyDown}
      tabIndex={!isDisabled && transfer.mode !== null && !(isSelected && items.length > 1) ? 0 : -1}
      role={!isDisabled && transfer.mode !== null ? 'button' : undefined}
      aria-label={!isDisabled && transfer.mode !== null ? `Select ${name}` : undefined}
      aria-disabled={isDisabled}
    >
      {/* Count Badge */}
      {items.length > 1 && (
        <div className="absolute top-1.5 left-3 bg-primary text-primary-foreground rounded-md px-2 py-0.5 text-xs font-semibold z-10 min-w-[24px] text-center shadow-sm tabular-nums">
          {items.length}
        </div>
      )}

      {/* Deselect Button (X) - for cards with multiple items that are selected */}
      {isSelected && transfer.mode !== null && (
        <button
          className="absolute top-0 right-0 bg-yellow-500 hover:bg-yellow-600 text-yellow-950 rounded-bl-md w-7 h-7 flex items-center justify-center text-lg font-bold z-10 shadow-sm transition-all hover:w-8 hover:h-8"
          onClick={handleDeselectClick}
          aria-label="Deselect"
          tabIndex={-1}
        >
          ×
        </button>
      )}

      <CardContent className="flex items-center gap-3 px-2 h-25">
        {/* Item Icon */}
        <div className="relative w-18 h-18 flex-shrink-0 flex flex-col justify-center gap-1.5">
          <img
            src={window.env.ICONS_BASE_URL + '/' + (items[0].imagePath || '') + '.png'}
            alt={name || 'Unknown Item'}
            className="max-w-full max-h-full object-contain"
          />

          {/* Rarity Bar Below Image */}
          {rarity?.color && (
            <div
              className="w-full h-1 rounded-full shadow-sm"
              style={{
                backgroundColor: rarity.color
              }}
            />
          )}

          {/* Transfer Input - Below Image */}
          {transfer.mode !== null && items.length > 1 && (
            <div
              className={cn(
                'absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-150',
                selectedCount > 0 || isInputFocused ? 'opacity-100' : 'opacity-0 pointer-events-none'
              )}
            >
              <Input
                ref={inputRef}
                type="text"
                value={displayValue}
                onChange={handleTransferAmount}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => {
                  setIsInputFocused(false)
                  setLocalInputValue('')
                }}
                placeholder="-"
                tabIndex={isSelected && items.length > 1 ? 0 : -1}
                className="w-12 h-6 px-1 py-0.5 text-xs font-semibold text-center bg-background/90 backdrop-blur-sm border border-input focus-visible:ring-2 focus-visible:ring-yellow-500/50 rounded-md shadow-sm transition-all tabular-nums"
                onClick={(e): void => e.stopPropagation()}
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex flex-col h-full flex-1 min-w-0 justify-between">
          {/* Item Name - Fixed height for alignment */}
          <div className="w-full h-[36px]">
            <span className="text-sm font-medium leading-tight block truncate" title={sanitizedName || 'Unknown Item'}>
              {sanitizedName || 'Unknown Item'}
            </span>
            <span
              className="text-xs font-medium leading-tight block truncate text-muted-foreground"
              title={secondaryInfo}
            >
              {/* Quality prefix if present */}
              {(name.includes('StatTrak™') || name.includes('Souvenir')) && (
                <span
                  className={
                    'mr-1 ' +
                    (name.includes('StatTrak™')
                      ? 'text-orange-500'
                      : name.includes('Souvenir')
                        ? 'text-yellow-400'
                        : '')
                  }
                >
                  {name.includes('StatTrak™') ? 'StatTrak™' : name.includes('Souvenir') ? 'Souvenir' : ''}
                </span>
              )}
              {secondaryInfo || '\u00A0'}
            </span>
          </div>

          {/* Copy Item Data Button for Unknown Items */}
          {name?.startsWith('Unknown Item') && (
            <div className="flex flex-col gap-1 justify-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs">1: </span>
                <Button size="sm" variant="outline" onClick={handleCopyItemData} className="h-6 px-2 text-xs">
                  Copy Item Ref
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs">2: </span>
                <Button size="sm" variant="outline" onClick={handleReportMissingItem} className="h-6 px-2 text-xs">
                  Report
                </Button>
              </div>
            </div>
          )}

          {/* Price - Fixed height for alignment */}
          <div className="flex flex-col h-[36px] justify-center">
            {items[0].price !== undefined && items[0].price > 0 ? (
              <div className="flex flex-col">
                <span className="text-sm font-medium dark:text-green-500/90 tabular-nums">
                  {usd.format(items[0].price * items.length)}
                </span>
                <span className="text-xs font-medium dark:text-green-500/60 tabular-nums">
                  {items.length > 1 ? usd.format(items[0].price) : '\u00A0'}
                </span>
              </div>
            ) : items[0].tradable ? (
              <span className="text-xs text-muted-foreground/60">No Price</span>
            ) : (
              <span className="text-xs text-muted-foreground/60">N/A</span>
            )}
          </div>

          {/* Float Value Bar - Fixed height for alignment */}
          <div className="h-[18px] flex items-center">
            {items[0].float !== undefined ? (
              <div className="flex items-center w-full">
                <div className="relative flex-1 h-2 rounded-sm overflow-hidden flex shadow-sm">
                  {/* Factory New: 0-0.07 */}
                  <div className="h-full bg-green-500/60" style={{ width: '7%' }} />
                  {/* Minimal Wear: 0.07-0.15 */}
                  <div className="h-full bg-lime-500/60" style={{ width: '8%' }} />
                  {/* Field-Tested: 0.15-0.38 */}
                  <div className="h-full bg-yellow-500/60" style={{ width: '23%' }} />
                  {/* Well-Worn: 0.38-0.45  */}
                  <div className="h-full bg-orange-500/60" style={{ width: '7%' }} />
                  {/* Battle-Scarred: 0.45-1.0 */}
                  <div className="h-full bg-red-500/60" style={{ width: '55%' }} />

                  {/* White indicator line */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-white shadow-sm"
                    style={{
                      left: `${items[0].float * 100}%`,
                      transform: 'translateX(-50%)'
                    }}
                  />
                </div>
                <span
                  className="text-xs font-medium text-muted-foreground tabular-nums min-w-[52px] text-right"
                  title={items[0].float.toString()}
                >
                  {items[0].float.toFixed(4)}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
