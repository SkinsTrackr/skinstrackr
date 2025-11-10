import { ipcMain } from 'electron'
import SteamSession from '../steam-session'
import GlobalOffensive from 'globaloffensive'
import Semaphore from '../util/semaphore'
import { writeFile } from 'fs/promises'
import { ConvertedItem } from '@shared/interfaces/inventory.types'
import { convertInventoryItem } from '../util/item-utils'

/**
 * Handle user login with Steam client token
 */
export function setupInventoryIPC(): void {
  ipcMain.handle('main:load-inventory', async (_event): Promise<ConvertedItem[]> => {
    const csgo = SteamSession.getInstance().getCsgo()!
    const inventory = csgo.inventory!

    const casketIds = inventory
      ?.filter((item) => item.casket_contained_item_count && item.id)
      .map((item) => item.id) as string[]
    const onlyContainerItems = await loadAllContainers(casketIds)
    const onlyInventoryItems = inventory.filter((item) => !item.casket_id)

    // Make sure directory exists
    await writeFile(
      './data/inventory.json',
      JSON.stringify([...onlyInventoryItems, ...onlyContainerItems], null, 2),
      'utf-8'
    )

    // const convertedInventory = await convertInventory([...onlyInventoryItems, ...onlyContainerItems])

    // const totalWorth = convertedInventory.reduce((sum, item) => sum + item.price, 0)
    // console.log('Inventory total worth:', totalWorth)

    return onlyInventoryItems.map((item) => convertInventoryItem(item))
  })
}

async function loadAllContainers(casketIds: string[]): Promise<GlobalOffensive.InventoryItem[]> {
  console.log('Loading inventory with casket IDs:', casketIds)
  const threads = new Semaphore(3) // Max caskets open at a time is 11, but this is unstable so we lower it
  let allItems: GlobalOffensive.InventoryItem[] = []

  await Promise.all(
    casketIds.map(async (containerId) => {
      console.log(`Want to load container: ${containerId}`)
      await threads.acquire() // Wait for a permit before proceeding
      console.log('Aquired', containerId)
      try {
        const items = await loadContainer(containerId)
        allItems = allItems.concat(items)
        console.log(`Loaded container: ${containerId} with ${items.length} items`)
      } finally {
        console.log('Released', containerId)
        threads.release() // Release the permit after processing
      }
    })
  )

  return allItems
}

async function loadContainer(containerId: string): Promise<GlobalOffensive.InventoryItem[]> {
  const csgo = SteamSession.getInstance().getCsgo()!

  return new Promise((resolve, reject) => {
    csgo.getCasketContents(containerId, (err, items) => {
      if (err) {
        console.error(`Failed to load container ${containerId}:`, err)
        reject(err)
      } else {
        items = items.filter((item) => item.def_index !== null && item.def_index !== undefined && item.def_index !== 0)
        resolve(items)
      }
    })
  })
}
