import { ConvertedItem } from '@shared/interfaces/inventory.types'
import { FC } from 'react'
import { Card, CardContent } from './ui/card'
import { Boxes } from 'lucide-react'

interface ContainerCardProps {
  container: ConvertedItem
  count: number
  selectedUnitsId: number[]
  setSelectedUnitsId: React.Dispatch<React.SetStateAction<number[]>>
}

export const ContainerCard: FC<ContainerCardProps> = ({ container, count, selectedUnitsId, setSelectedUnitsId }) => {
  return (
    <Card
      key={container.id}
      className={`cursor-pointer hover:bg-accent transition-colors relative ${
        selectedUnitsId.includes(container.id) ? 'bg-accent' : ''
      }`}
      onClick={() => {
        setSelectedUnitsId((prevIds) => {
          if (prevIds.includes(container.id)) {
            return prevIds.filter((id) => id !== container.id)
          } else {
            return [...prevIds, container.id]
          }
        })
      }}
    >
      <CardContent className="flex items-center gap-3 px-2 h-8">
        {container.id === 0 ? (
          <Boxes strokeWidth={0.9} className="h-15 w-10 text-muted-foreground" />
        ) : (
          <img
            src={window.env.ICONS_BASE_URL + '/' + (container.imagePath || '') + '.png'}
            alt="Storage Unit"
            className="h-15 w-10 object-contain"
          />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium">{container.customName || container.hashName || 'Storage Unit'}</span>
          <span className="text-xs text-muted-foreground pt-1">{count} items</span>
        </div>
      </CardContent>

      {/* <ChevronsRight className="absolute -right-5 top-1/2 -translate-y-1/2 h-10 w-10 pointer-events-none" /> */}
    </Card>
  )
}
