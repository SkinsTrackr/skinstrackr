import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { FC, useState, useMemo } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group'
import { Search } from 'lucide-react'
import StorageUnitLogo from '@/assets/storage_unit.png'

interface StorageUnit {
  id: number
  name: string
  itemCount: number
}

// Test data for storage units
const storageUnits: StorageUnit[] = [
  { id: 1, name: 'Storage Unit 1', itemCount: 15 },
  { id: 2, name: 'Operation Riptide Ca', itemCount: 42 },
  { id: 3, name: 'CS20 Case', itemCount: 28 },
  { id: 4, name: 'Dreams & Nightmaress', itemCount: 67 },
  { id: 5, name: 'Snakebite Case', itemCount: 31 },
  { id: 6, name: 'Sticker Capsule 2', itemCount: 19 },
  { id: 7, name: 'Revolution Case', itemCount: 55 },
  { id: 8, name: 'Recoil Case', itemCount: 23 },
  { id: 9, name: 'Glove Case', itemCount: 12 },
  { id: 10, name: 'Horizon Case', itemCount: 44 },
  { id: 11, name: 'Prisma Case', itemCount: 29 },
  { id: 12, name: 'Fracture Case', itemCount: 38 },
  { id: 13, name: 'Clutch Case', itemCount: 21 },
  { id: 14, name: 'Broken Fang Case', itemCount: 47 },
  { id: 15, name: 'Operation Hydra Case', itemCount: 33 },
  { id: 16, name: 'Chroma 3 Case', itemCount: 26 },
  { id: 17, name: 'Gamma Case', itemCount: 30 },
  { id: 18, name: 'Huntsman Case', itemCount: 40 },
  { id: 19, name: 'Winter Offensive Case', itemCount: 22 },
  { id: 20, name: 'eSports 2013 Case', itemCount: 18 },
  { id: 21, name: 'eSports 2014 Case', itemCount: 27 },
  { id: 22, name: 'Operation Bravo Case', itemCount: 35 },
  { id: 23, name: 'Operation Phoenix Ca', itemCount: 39 },
  { id: 24, name: 'Operation Breakout C', itemCount: 41 },
  { id: 25, name: 'Chroma 2 Case', itemCount: 24 }
]

export const StorageUnitsList: FC = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredUnits = useMemo(
    () =>
      storageUnits
        .filter((unit) => unit.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [searchQuery]
  )

  return (
    <div className="w-55 flex flex-col h-screen">
      <div className="pr-4">
        <InputGroup>
          <InputGroupInput
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">{filteredUnits.length}</InputGroupAddon>
        </InputGroup>
      </div>
      <ScrollArea className="h-full mt-5" type="auto">
        <div className="flex flex-col gap-2 mr-4">
          {filteredUnits.map((unit) => (
            <Card key={unit.id} className="cursor-pointer hover:bg-accent transition-colors">
              <CardContent className="flex items-center gap-3 px-2 h-8">
                <img src={StorageUnitLogo} alt="Storage Unit" className="h-15 w-10 object-contain" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{unit.name}</span>
                  <span className="text-xs text-muted-foreground pt-1">{unit.itemCount} items</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
