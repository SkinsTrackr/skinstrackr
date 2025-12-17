import { ConvertedContainer, TransferItems } from '@shared/interfaces/inventory.types'
import { FC, useMemo, useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Boxes } from 'lucide-react'

interface ContainerCardProps {
  container: ConvertedContainer
  count: number
  transfer: TransferItems
  setTransfer: React.Dispatch<React.SetStateAction<TransferItems>>
}

export const ContainerCard: FC<ContainerCardProps> = ({ container, count, transfer, setTransfer }) => {
  const [selectable, setSelectable] = useState(true)

  // Whether we can remove or add a container
  useMemo(() => {
    if (transfer.mode !== null) {
      if (container.id === 0) {
        setSelectable(false)
      } else {
        setSelectable(true)
      }
    }
  }, [transfer.mode, container.id])

  return (
    <Card
      key={container.id}
      className={`${selectable ? 'cursor-pointer hover:bg-accent' : ''} transition-colors relative ${
        transfer.fromContainerIds.includes(container.id!) ? 'bg-accent' : ''
      }`}
      onClick={() => {
        if (transfer.mode !== null) {
          // Inventory not (un)selectable in transfer mode
          if (container.id === 0) {
            return
          } else if (transfer.mode === 'toContainer') {
            setTransfer((prev) => ({
              ...prev,
              fromContainerIds: [0],
              toContainerId: container.id!
            }))
            return
          }
        }

        setTransfer((prevIds) => {
          const isSelected = prevIds.fromContainerIds.includes(container.id!)
          return {
            ...prevIds,
            fromContainerIds: isSelected
              ? prevIds.fromContainerIds.filter((id) => id !== container.id)
              : [...prevIds.fromContainerIds, container.id!]
          }
        })
      }}
    >
      <CardContent className="flex items-center gap-3 px-2 h-8">
        {container.id === 0 ? (
          <Boxes strokeWidth={0.9} className="h-15 w-10 text-muted-foreground" />
        ) : (
          <img
            src={window.env.ICONS_BASE_URL + '/' + (container.container.imagePath || '') + '.png'}
            alt="Storage Unit"
            className="h-15 w-10 object-contain"
          />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {container.container.customName || container.container.hashName || 'Storage Unit'}
          </span>
          <span className="text-xs text-muted-foreground pt-1">{count} items</span>
        </div>
      </CardContent>

      {/* <ChevronsRight className="absolute -right-5 top-1/2 -translate-y-1/2 h-10 w-10 pointer-events-none" /> */}
    </Card>
  )
}
