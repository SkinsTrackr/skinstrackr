import { ipcMain } from 'electron'
import SteamSession from '../steam-session'
import GlobalOffensive from 'globaloffensive'
import Semaphore from '../util/semaphore'
import {
  ConvertedInventory,
  RawInventory,
  RawContainer,
  TransferMode,
  ConvertedContainer
} from '@shared/interfaces/inventory.types'
import {
  ATTRIBUTE_MODIFICATION_DATE,
  convertContainer,
  getQualities,
  getRarities,
  readAttribute
} from '../util/item-utils'
import * as fs from 'fs'
import { pack, unpack } from 'msgpackr'

export function setupInventoryIPC(): void {
  ipcMain.handle(
    'main:transfer-items',
    async (_event, containerId: string, itemId: string, mode: TransferMode): Promise<boolean> => {
      if (SteamSession.getInstance().isLoggedIn() === false) {
        throw new Error('Log in before transferring items')
      }

      //   const csgo = SteamSession.getInstance().getCsgo()!

      // Check if from/to containers are up to date?

      //   const listeners = (): Promise<string> => {
      //     return new Promise<string>((resolve, reject) => {
      //       let resolvedCount = 0
      //       const responses: Array<{ type: string; data: unknown }> = []

      //       const checkComplete = (): void => {
      //         resolvedCount++
      //         console.log(`Resolved events count: ${resolvedCount}`)
      //         if (resolvedCount >= 2) {
      //           resolve('Both events received')
      //         }
      //       }

      //       const itemAddedListener = (response): void => {
      //         console.log('Item added to casket', response)
      //         responses.push({ type: 'itemAdded', data: response })
      //         checkComplete()
      //       }

      //       const itemRemovedListener = (response): void => {
      //         console.log('Item acquired from casket:', response)
      //         responses.push({ type: 'itemRemoved', data: response })
      //         checkComplete()
      //       }

      //       const itemCustomizationListener = (response): void => {
      //         console.log('Item customization notification received:', response)
      //         responses.push({ type: 'itemCustomization', data: response })
      //         checkComplete()
      //       }

      //       csgo.once('itemRemoved', itemAddedListener)
      //       csgo.once('itemAcquired', itemRemovedListener)
      //       csgo.once('itemCustomizationNotification', itemCustomizationListener)

      //       console.log('Called addToCasket with', { containerId, itemId })
      //     })
      //   }

      //   console.log('wtf1')
      //   console.log(containerId, itemId)
      //   await loadContainer(containerId)
      //   csgo.addToCasket(containerId, itemId)
      //   csgo.once('itemCustomizationNotification', (itemIds, notificationType) => {
      //     console.log('items:', itemIds, 'type:', notificationType)
      //   })
      //   //   await listeners()
      //   console.log('wtf')

      return true
    }
  )

  /**
   * Load user's inventory
   * @param force Whether to force reload the inventory from Steam or use local cached version
   * @returns User's inventory items, including in containers (Excludes container contents)
   */
  ipcMain.handle('main:load-inventory', async (_event, force: boolean): Promise<ConvertedInventory> => {
    let rawInventory: RawInventory = {
      inventory: {
        id: 0,
        container: { position: 0, custom_name: 'Inventory', id: '0' }, // Dummy container item
        items: [],
        lastRefresh: Date.now(),
        lastModification: Date.now()
      },
      containers: [],
      lastRefresh: Date.now()
    }
    const steamId = SteamSession.getInstance().getSteamId()

    if (!steamId) {
      throw new Error('No Steam user logged in or selected from cache')
    }
    if (force && SteamSession.getInstance().isLoggedIn() === false) {
      throw new Error('Log in before refreshing inventory')
    }

    // Get cached or "fresh" inventory
    if (!force) {
      if (!fs.existsSync(`./data/${steamId}_inventory.json`)) {
        throw new Error(`Need to login as user ${steamId} first to use cached inventory`)
      }

      console.log(`Loading cached inventory`)
      rawInventory = await loadInventoryFromFile(steamId)
    } else {
      if (!SteamSession.getInstance().isLoggedIn()) {
        throw new Error('Cannot refresh inventory without being logged in')
      }

      console.log(`Loading fresh inventory from Steam`)
      const csgo = SteamSession.getInstance().getCsgo()

      // Get inventory
      const rootItems = (csgo?.inventory ?? undefined)?.filter((item) => item.casket_id === undefined)
      if (!rootItems) {
        throw new Error('Could not get inventory: ')
      }
      rawInventory.inventory.items = rootItems.filter((item) => !item.casket_contained_item_count && item.id)

      const caskets = rootItems?.filter((item) => item.casket_contained_item_count && item.id)
      rawInventory.containers = await loadAllContainers(caskets)

      rawInventory.lastRefresh = Date.now()

      await saveInventoryToFile(rawInventory, steamId)
    }

    console.log(`Loaded inventory with ${rawInventory.containers.length} containers`)
    const convertedInventory: ConvertedContainer = convertContainer(rawInventory.inventory)
    const convertedContainers: ConvertedContainer[] = rawInventory.containers.map((container) =>
      convertContainer(container)
    )

    // For testing
    // for (let i = 0; i < 900000; i++) {
    //   convertedInventory.push({
    //     id: `${i + 2000000}`,
    //     hashName: `Test ItemItemItemItemItemItemItem Item Item Item ItemItemItemItem ${i}`,
    //     rarity: '1',
    //     quality: '1',
    //     isStorageUnit: false,
    //     containerId: `${i + 1000000}`,
    //     tradable: true
    //   })
    // }

    return {
      inventory: convertedInventory,
      containers: convertedContainers,
      lastRefresh: rawInventory.lastRefresh,
      qualities: getQualities(),
      rarities: getRarities()
    }
  })
}

async function loadAllContainers(caskets: GlobalOffensive.InventoryItem[]): Promise<RawContainer[]> {
  console.log(
    'Loading inventory with casket IDs:',
    caskets.map((casket) => casket.id)
  )
  const threads = new Semaphore(3) // Max caskets open at a time is 11, but this is unstable so we lower it
  const containers: RawContainer[] = []

  await Promise.all(
    caskets.map(async (casket) => {
      console.log(`Want to load container: ${casket.id}`)
      await threads.acquire() // Wait for a permit before proceeding
      console.log('Acquired', casket.id)
      try {
        const loadedCasket = await loadContainer(casket)
        containers.push(loadedCasket)
        console.log(`Loaded container: ${casket.id} with ${loadedCasket.items.length} items`)
      } finally {
        console.log('Released', casket.id)
        threads.release() // Release the permit after processing
      }
    })
  )

  return containers
}

async function loadContainer(casket: GlobalOffensive.InventoryItem): Promise<RawContainer> {
  const csgo = SteamSession.getInstance().getCsgo()!

  return new Promise((resolve, reject) => {
    csgo.getCasketContents(casket.id!, (err, items) => {
      if (err) {
        console.error(`Failed to load container ${casket.id}:`, err)
        reject(err)
      } else {
        items = items.filter((item) => item.def_index !== null && item.def_index !== undefined && item.def_index !== 0)
        resolve({
          id: Number(casket.id),
          container: casket,
          items: items,
          lastRefresh: Date.now(),
          lastModification: readAttribute(casket, ATTRIBUTE_MODIFICATION_DATE) ?? 0
        })
      }
    })
  })
}

async function saveInventoryToFile(inventory: RawInventory, userId: string): Promise<void> {
  const encoded = pack(inventory)
  await fs.writeFileSync(`./data/${userId}_inventory.bin`, encoded)
  await fs.writeFileSync(`./data/${userId}_inventory.json`, JSON.stringify(inventory, null, 2), 'utf-8') // Just for testing TODO Remove
}

async function loadInventoryFromFile(userId: string): Promise<RawInventory> {
  const loaded = await fs.readFileSync(`./data/${userId}_inventory.bin`)
  const decoded = unpack(loaded) as RawInventory
  return decoded
}
