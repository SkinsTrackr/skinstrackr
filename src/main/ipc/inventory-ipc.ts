import { ipcMain } from 'electron'
import SteamSession from '../steam-session'
import GlobalOffensive from 'globaloffensive'
import { ConvertedInventory, RawInventory, ConvertedContainer, TransferItems } from '@shared/interfaces/inventory.types'
import { convertContainer, getQualities, getRarities } from '../util/item-utils'
import { inventoryFileExists, loadInventoryFromFile, syncInventoryCache } from '../util/inventory-utils'
import { accounts } from '../util/client-store-utils'
import log from 'electron-log/main'

// Global transfer state
let isTransferCancelled = false

export function setupInventoryIPC(): void {
  ipcMain.handle('main:get-raw-item-data', async (_event, itemId: number): Promise<GlobalOffensive.InventoryItem> => {
    const steamId = SteamSession.getInstance().getSteamId()!
    const inventory = await loadInventoryFromFile(steamId)

    return new Promise((resolve, reject) => {
      for (const item of inventory.inventory.items) {
        if (Number(item.id) === itemId) {
          resolve(item)
          return
        }
      }
      for (const container of inventory.containers) {
        for (const item of container.items) {
          if (Number(item.id) === itemId) {
            resolve(item)
            return
          }
        }
      }
      reject(new Error(`Item with ID ${itemId} not found in inventory`))
    })
  })

  ipcMain.handle('main:cancel-transfer', async (): Promise<void> => {
    log.info('Cancel transfer requested')
    isTransferCancelled = true
  })

  ipcMain.handle('main:transfer-items', async (event, transfer: TransferItems): Promise<void> => {
    if (SteamSession.getInstance().isLoggedIn() === false) {
      throw new Error('Log in before transferring items')
    }

    // Reset cancel flag at the start of a new transfer
    isTransferCancelled = false

    const csgo = SteamSession.getInstance().getCsgo()!

    // const threads = new Semaphore(15) // Max transfers in progress at a time
    const transferPromises: Promise<void>[] = []
    const pendingTransfers = new Map<
      number,
      { resolve: () => void; reject: (err: Error) => void; timeoutId: NodeJS.Timeout }
    >()

    const sleep = (ms: number): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, ms))

    const releasePendingTransfer = async (itemId: number, success: boolean): Promise<void> => {
      const pendingTransfer = pendingTransfers.get(itemId)
      if (pendingTransfer) {
        if (success) {
          log.info(`Item ${itemId} transfer completed successfully`)
        } else {
          log.error(`Item ${itemId} transfer failed or timed out`)
        }
        clearTimeout(pendingTransfer.timeoutId)
        event.sender.send('renderer:transfer-progress', itemId, success)
        pendingTransfer.resolve()
        pendingTransfers.delete(itemId)
        // await sleep(200) // Small delay before releasing permit
        // threads.release()
      } else {
        log.warn(`No pending transfer found for item ${itemId}`)
      }
    }

    const itemRemovedListener = (item: GlobalOffensive.InventoryItem): void => {
      console.log('Item removed:', item.id)
      releasePendingTransfer(Number(item.id!), true)
    }
    const itemAcquiredListener = (item: GlobalOffensive.InventoryItem): void => {
      console.log('Item acquired:', item.id)
      releasePendingTransfer(Number(item.id!), true)
    }

    if (transfer.mode === 'toContainer') {
      csgo.on('itemRemoved', itemRemovedListener)
    } else if (transfer.mode === 'toInventory') {
      csgo.on('itemAcquired', itemAcquiredListener)
    }

    try {
      for (const containerId of Object.keys(transfer.selectedItems)) {
        for (const itemId of transfer.selectedItems[containerId]) {
          // Check if cancelled before each item
          if (isTransferCancelled) {
            log.warn('Transfer cancelled by user')
            break
          }

          //   console.log(threads.getAvailablePermits())
          //   await threads.acquire()
          await sleep(100) // Small delay to avoid overwhelming the Steam servers

          // Set a timeout for this specific transfer
          const transferPromise = new Promise<void>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              releasePendingTransfer(itemId, false)
            }, 1000)
            pendingTransfers.set(itemId, { resolve, reject, timeoutId })
          })

          transferPromises.push(transferPromise)

          if (transfer.mode === 'toContainer') {
            log.info(`Transferring item ${itemId} into container ${transfer.toContainerId}`)
            csgo.addToCasket(transfer.toContainerId.toString(), itemId)
          } else if (transfer.mode === 'toInventory') {
            log.info(`Transferring item ${itemId} out of container ${containerId}`)
            csgo.removeFromCasket(containerId, itemId)
          }
        }
      }

      // Wait for all transfers to complete before returning
      await Promise.all(transferPromises)
    } catch (error) {
      log.error('Transfer error:', error)
    } finally {
      isTransferCancelled = false
      csgo.off('itemAcquired', itemAcquiredListener)
      csgo.off('itemRemoved', itemRemovedListener)
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

      log.info(
        `Syncing inventory cache for user ${steamId}, fromCache=${fromCache}, onlyChangedContainers=${onlyChangedContainers}`
      )

      // Get cached or "fresh" inventory
      // If "fresh" inventory, get changed or all containers
      if (fromCache) {
        if ((await inventoryFileExists(steamId)) === false) {
          throw new Error(`Need to login as user ${steamId} first to use cached inventory`)
        }

        log.info(`Loading cached inventory for user ${account.username}`)
        rawInventory = await loadInventoryFromFile(steamId)
      } else {
        rawInventory = await syncInventoryCache(steamId, onlyChangedContainers)
      }

      if (!rawInventory || !rawInventory.inventory) {
        throw new Error('Failed to load inventory for ' + account.username)
      }

      log.info(`Loaded inventory with ${rawInventory.containers.length} containers`)
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
