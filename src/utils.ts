import browserPolyfill from 'webextension-polyfill'
import { customAlphabet, nanoid } from 'nanoid'

// nanoid util generator - https://zelark.github.io/nano-id-cc/
const alphabet =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
export const createRoomId = customAlphabet(alphabet, 8)

export const STORAGE_KEYS = {
  ROOM_ID: 'roomId',
  ENABLED: 'enabled',
  USER_ID: 'userId',
}

const ENABLE_DEBUG = process.env.ENABLE_DEBUG === 'true'
console.log('ENABLE_DEBUG', ENABLE_DEBUG)
export const logger = {
  log: (...args: any[]) => {
    if (!ENABLE_DEBUG) return

    console.debug(...args)
  },
}

export async function getStorageValues() {
  const storage = (await browserPolyfill.storage.local.get([
    STORAGE_KEYS.ROOM_ID,
    STORAGE_KEYS.ENABLED,
    STORAGE_KEYS.USER_ID,
  ])) as {
    roomId?: string
    enabled?: boolean
    userId?: string
  }

  let { roomId, enabled = false, userId } = storage

  // generate a room id if one doesn't exist
  if (!roomId) {
    logger.log('No roomId found in storage, generating one...')
    roomId = createRoomId()
    await browserPolyfill.storage.local.set({ [STORAGE_KEYS.ROOM_ID]: roomId })
  }
  if (!userId) {
    logger.log('No userId found in storage, generating one...')
    userId = nanoid()
    await browserPolyfill.storage.local.set({ [STORAGE_KEYS.USER_ID]: userId })
  }
  logger.log('storage', { roomId, enabled, userId })

  return { roomId, enabled, userId }
}

export async function sendMessageToTab(message: BrowserMessage) {
  try {
    const tab = await getActiveTab()

    if (!tab || !tab.id) throw new Error('No active tab found to send msg')

    browserPolyfill.tabs.sendMessage(tab.id, message)
    logger.log('message sent to tab', message)
  } catch (error) {
    logger.log('error sending sync message', error, message)
  }
}

export async function getActiveTab() {
  const [tab] = await browserPolyfill.tabs.query({
    active: true,
    currentWindow: true,
  })
  return tab
}

export async function sendBrowserMessage(message: BrowserMessage) {
  try {
    logger.log('sending browser message', message)
    await browserPolyfill.runtime.sendMessage(message)
  } catch (error) {
    logger.log('error sending browser message', error, message)
  }
}

export interface BrowserMessage {
  type:
    | 'sync'
    | 'findVideo'
    | 'checkForVideo'
    | 'play'
    | 'pause'
    | 'seeked'
    | 'playbackRateChanged'
    | 'getSocketStatus'
    | 'attemptConnectSocket'
  data?: any
}

export interface GetSocketStatusData {
  isConnected: boolean
}

/** akin to is tab visible. used in content scripts. use tabs.query in action/background scripts */
export function isDocumentVisible() {
  return document.visibilityState === 'visible'
}

// https://stackoverflow.com/a/45985333/5434172
export function getBrowser() {
  // @ts-ignore
  if (typeof chrome !== 'undefined') {
    // @ts-ignore
    if (typeof browser !== 'undefined') {
      return 'Firefox'
    } else {
      return 'Chrome'
    }
  }
}
