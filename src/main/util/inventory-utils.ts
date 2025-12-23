import SteamSession from '../steam-session'
import GlobalOffensive from 'globaloffensive'
import Semaphore from '../util/semaphore'
import { RawInventory, RawContainer } from '@shared/interfaces/inventory.types'
import { ATTRIBUTE_MODIFICATION_DATE, readAttribute } from '../util/item-utils'
import * as fs from 'fs'
import { pack, unpack } from 'msgpackr'

export async function loadAllContainers(caskets: GlobalOffensive.InventoryItem[]): Promise<RawContainer[]> {
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
          lastModification: (readAttribute(casket, ATTRIBUTE_MODIFICATION_DATE) ?? 0) * 1000
        })
      }
    })
  })
}

/**
 * Check which containers are out of sync and need to be refreshed.
 * This also includes containers that are new or not in inventory anymore.
 */
export async function getContainersOutOfSync(): Promise<number[]> {
  const outOfSyncContainerIds: number[] = []
  if (!SteamSession.getInstance().isLoggedIn()) {
    throw new Error('Log in before fetching inventory/containers')
  }

  const csgo = SteamSession.getInstance().getCsgo()
  const caskets = (csgo?.inventory ?? undefined)?.filter(
    (item) => item.casket_id === undefined && item.casket_contained_item_count && item.id
  )
  if (!caskets) {
    throw new Error('Could not get inventory for container sync check')
  }

  // Get cached inventory
  const cachedInventory = await loadInventoryFromFile(SteamSession.getInstance().getSteamId()!)

  // Containers in inventory that are not in cache or out of sync, we need to refresh
  for (const casket of caskets) {
    const cachedContainer = cachedInventory.containers.find((c) => c.id === Number(casket.id))
    const lastModification = (readAttribute(casket, ATTRIBUTE_MODIFICATION_DATE) ?? 0) * 1000

    if (!cachedContainer || cachedContainer.lastRefresh < lastModification) {
      outOfSyncContainerIds.push(Number(casket.id))
    }
  }

  // Containers in cache that are not in inventory anymore, we need to refresh
  for (const cachedContainer of cachedInventory.containers) {
    const casket = caskets.find((item) => Number(item.id) === cachedContainer.id)
    if (!casket) {
      outOfSyncContainerIds.push(cachedContainer.id)
    }
  }

  return outOfSyncContainerIds
}

/**
 * Fetch all containers and update local cache if they have changed since last refresh
 * @param force Fetch and refresh even if not changed
 */
export async function syncInventoryCache(userId: string, onlyChangedContainers: boolean): Promise<RawInventory> {
  if (!SteamSession.getInstance().isLoggedIn()) {
    throw new Error('Log in before fetching inventory')
  }
  const csgo = SteamSession.getInstance().getCsgo()
  const rootItems = (csgo?.inventory ?? undefined)?.filter((item) => item.casket_id === undefined)
  if (!rootItems) {
    throw new Error('Could not get inventory: ')
  }

  let rawInventory: RawInventory
  // If we force update of inventory, we load all containers and
  // start with a clean slate altogether
  if (!onlyChangedContainers) {
    rawInventory = {
      inventory: {
        id: 0,
        container: { position: 0, custom_name: 'Inventory', id: '0' }, // Dummy container item
        items: rootItems.filter((item) => !item.casket_contained_item_count && item.id) || [],
        lastRefresh: Date.now(),
        lastModification: Date.now()
      },
      containers: [],
      lastRefresh: Date.now()
    }

    const caskets = rootItems?.filter((item) => item.casket_contained_item_count && item.id)
    rawInventory.containers = await loadAllContainers(caskets)
  } else {
    rawInventory = await loadInventoryFromFile(userId)

    // We update inventory
    console.log('Syncing root inventory items')
    rawInventory.inventory = {
      id: 0,
      container: { position: 0, custom_name: 'Inventory', id: '0' }, // Dummy container item
      items: rootItems.filter((item) => !item.casket_contained_item_count && item.id) || [],
      lastRefresh: Date.now(),
      lastModification: Date.now()
    }
    rawInventory.lastRefresh = Date.now()

    const outOfSyncContainerIds = await getContainersOutOfSync()
    console.log('Out of sync container IDs:', outOfSyncContainerIds)

    for (const containerId of outOfSyncContainerIds) {
      const cachedContainer = rawInventory.containers.find((c) => c.id === containerId)
      const containerItem = rootItems.find((item) => Number(item.id) === containerId)

      // Container does not exist in cache anymore, remove from cache
      if (cachedContainer && !containerItem) {
        console.warn(`Container item with ID ${containerId} not found in root items. We delete from cache.`)
        rawInventory.containers = rawInventory.containers.filter((c) => c.id !== containerId)
        continue
      }

      // Container does not exist in live inventory anymore, add to cache
      if (!cachedContainer && containerItem) {
        console.warn(`Container item with ID ${containerId} not found in cache. We add to cache.`)
        const updatedContainer = await loadContainer(containerItem)
        rawInventory.containers.push(updatedContainer)
        continue
      }

      // Container does not exist in cache or live inventory, skip
      if (!containerItem && !cachedContainer) {
        console.warn(`Container item with ID ${containerId} not found in root items nor in cache. Skipping.`)
        continue
      }

      // Cache and live containers exist, so refresh container items in cache
      const lastModification = (readAttribute(containerItem!, ATTRIBUTE_MODIFICATION_DATE) ?? 0) * 1000
      if (cachedContainer!.lastRefresh < lastModification) {
        console.log(`Syncing container ${containerId}`)
        const index = rawInventory.containers.findIndex((c) => c.id === containerId)
        const updatedContainer = await loadContainer(containerItem!)
        rawInventory.containers[index] = updatedContainer
      }
    }
  }

  await saveInventoryToFile(rawInventory, userId)
  return rawInventory
}

export async function saveInventoryToFile(inventory: RawInventory, userId: string): Promise<void> {
  const encoded = pack(inventory)
  await fs.writeFileSync(`./data/${userId}_inventory.bin`, encoded)
  await fs.writeFileSync(`./data/${userId}_inventory.json`, JSON.stringify(inventory, null, 2), 'utf-8') // Just for testing TODO Remove
}

export async function loadInventoryFromFile(userId: string): Promise<RawInventory> {
  const loaded = await fs.readFileSync(`./data/${userId}_inventory.bin`)
  const decoded = unpack(loaded) as RawInventory
  return decoded
}
