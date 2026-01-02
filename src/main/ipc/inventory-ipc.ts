import { ipcMain } from 'electron'
import SteamSession from '../steam-session'
import GlobalOffensive from 'globaloffensive'
import { ConvertedInventory, RawInventory, ConvertedContainer, TransferItems } from '@shared/interfaces/inventory.types'
import { convertContainer, getQualities, getRarities } from '../util/item-utils'
import { inventoryFileExists, loadInventoryFromFile, syncInventoryCache } from '../util/inventory-utils'
import Semaphore from '../util/semaphore'
import { accounts } from '../util/client-store-utils'

// Global transfer state
let isTransferCancelled = false

export function setupInventoryIPC(): void {
  ipcMain.handle('main:cancel-transfer', async (): Promise<void> => {
    console.log('Cancel transfer requested')
    isTransferCancelled = true
  })

  ipcMain.handle('main:transfer-items', async (event, transfer: TransferItems): Promise<void> => {
    if (SteamSession.getInstance().isLoggedIn() === false) {
      throw new Error('Log in before transferring items')
    }

    // Reset cancel flag at the start of a new transfer
    isTransferCancelled = false

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
        // Check if cancelled before processing next container
        if (isTransferCancelled) {
          console.warn('Transfer cancelled by user')
          break
        }

        for (const itemId of transfer.selectedItems[containerId]) {
          // Check if cancelled before each item
          if (isTransferCancelled) {
            console.warn('Transfer cancelled by user')
            break
          }

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
            }, 5000)
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
      isTransferCancelled = false
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

      if (steamId === null) {
        throw new Error('No Steam user logged in or selected from cache')
      }
      if (!fromCache && SteamSession.getInstance().isLoggedIn() === false) {
        throw new Error('Log in before refreshing inventory')
      }
      const account = accounts.getAccounts()[steamId]
      if (!account) {
        throw new Error('No account found for SteamID: ' + steamId)
      }

      console.log(
        `Syncing inventory cache for user ${steamId}, fromCache=${fromCache}, onlyChangedContainers=${onlyChangedContainers}`
      )

      // Get cached or "fresh" inventory
      // If "fresh" inventory, get changed or all containers
      if (fromCache) {
        if ((await inventoryFileExists(steamId)) === false) {
          throw new Error(`Need to login as user ${steamId} first to use cached inventory`)
        }

        console.log(`Loading cached inventory for user ${account.username}`)
        rawInventory = await loadInventoryFromFile(steamId)
      } else {
        rawInventory = await syncInventoryCache(steamId, onlyChangedContainers)
      }

      if (!rawInventory || !rawInventory.inventory) {
        throw new Error('Failed to load inventory for ' + account.username)
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
