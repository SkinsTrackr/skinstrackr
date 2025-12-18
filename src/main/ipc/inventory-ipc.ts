import { ipcMain } from 'electron'
import SteamSession from '../steam-session'
import GlobalOffensive from 'globaloffensive'
import { ConvertedInventory, RawInventory, ConvertedContainer, TransferItems } from '@shared/interfaces/inventory.types'
import { convertContainer, getQualities, getRarities } from '../util/item-utils'
import * as fs from 'fs'
import { loadInventoryFromFile, syncInventoryCache } from '../util/inventory-utils'
import Semaphore from '../util/semaphore'

export function setupInventoryIPC(): void {
  ipcMain.handle('main:transfer-items', async (event, transfer: TransferItems): Promise<void> => {
    if (SteamSession.getInstance().isLoggedIn() === false) {
      throw new Error('Log in before transferring items')
    }

    const csgo = SteamSession.getInstance().getCsgo()!
    // const rawInventory = await loadInventoryFromFile(SteamSession.getInstance().getSteamId()!)

    const threads = new Semaphore(3) // Max transfers in progress at a time
    const transferPromises: Promise<void>[] = []
    const pendingTransfers = new Map<
      number,
      { resolve: () => void; reject: (err: Error) => void; timeoutId: NodeJS.Timeout }
    >()

    // Item removed from one container to another (including from/to inventory)
    const itemAcquiredListener = (item: GlobalOffensive.InventoryItem): void => {
      event.sender.send('renderer:transfer-progress', item.id!, true)

      const pending = pendingTransfers.get(Number(item.id!))
      if (pending) {
        clearTimeout(pending.timeoutId)
        pending.resolve()
        pendingTransfers.delete(Number(item.id!))
        threads.release()
      } else {
        console.warn(`No pending transfer found for item ${item.id!}`)
      }
    }
    csgo.on('itemAcquired', itemAcquiredListener)

    try {
      for (const containerId of Object.keys(transfer.selectedItems)) {
        for (const itemId of transfer.selectedItems[containerId]) {
          await threads.acquire()
          console.log('Acquired', itemId)

          // Set a timeout for this specific transfer
          const transferPromise = new Promise<void>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              if (pendingTransfers.has(itemId)) {
                pendingTransfers.delete(itemId)
                event.sender.send('renderer:transfer-progress', itemId, false)
                reject(new Error(`Transfer timeout for item ${itemId}`))
                threads.release()
              }
            }, 4000)
            pendingTransfers.set(itemId, { resolve, reject, timeoutId })
          })

          transferPromises.push(transferPromise)

          if (transfer.mode === 'toContainer') {
            console.log(`Transferring item ${itemId} into container ${transfer.toContainerId}`)
            csgo.addToCasket(transfer.toContainerId.toString(), itemId)
          } else if (transfer.mode === 'toInventory') {
            console.log(`Transferring item ${itemId} out of container ${containerId}`)
            csgo.removeFromCasket(containerId, itemId)
          }
        }
      }

      // Wait for all transfers to complete before returning
      await Promise.all(transferPromises)
    } catch (error) {
      console.error('Transfer error:', error)
    } finally {
      csgo.off('itemAcquired', itemAcquiredListener)
    }
  })

  /**
   * Load user's inventory
   * @param force Whether to force reload the inventory from Steam or use local cached version
   * @returns User's inventory items, including in containers (Excludes container contents)
   */
  ipcMain.handle(
    'main:load-inventory',
    async (_event, fromCache: boolean, onlyChangedContainers: boolean): Promise<ConvertedInventory> => {
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
      if (!fromCache && SteamSession.getInstance().isLoggedIn() === false) {
        throw new Error('Log in before refreshing inventory')
      }

      console.log(
        `Syncing inventory cache for user ${steamId}, fromCache=${fromCache}, onlyChangedContainers=${onlyChangedContainers}`
      )

      // Get cached or "fresh" inventory
      // If "fresh" inventory, get changed or all containers
      if (fromCache) {
        if (!fs.existsSync(`./data/${steamId}_inventory.json`)) {
          throw new Error(`Need to login as user ${steamId} first to use cached inventory`)
        }

        console.log(`Loading cached inventory`)
        rawInventory = await loadInventoryFromFile(steamId)
      } else {
        rawInventory = await syncInventoryCache(steamId, onlyChangedContainers)
      }

      console.log(`Loaded inventory with ${rawInventory.containers.length} containers`)
      const convertedInventory: ConvertedContainer = convertContainer(rawInventory.inventory)
      const convertedContainers: ConvertedContainer[] = rawInventory.containers.map((container) =>
        convertContainer(container)
      )

      return {
        inventory: convertedInventory,
        containers: convertedContainers,
        lastRefresh: rawInventory.lastRefresh,
        qualities: getQualities(),
        rarities: getRarities()
      }
    }
  )
}
