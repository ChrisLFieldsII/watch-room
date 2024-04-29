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
    console.debug('No roomId found in storage, generating one...')
    roomId = createRoomId()
    await browserPolyfill.storage.local.set({ [STORAGE_KEYS.ROOM_ID]: roomId })
  }
  if (!userId) {
    console.debug('No userId found in storage, generating one...')
    userId = nanoid()
    await browserPolyfill.storage.local.set({ [STORAGE_KEYS.USER_ID]: userId })
  }
  console.debug('storage', { roomId, enabled, userId })

  return { roomId, enabled, userId }
}

export async function sendMessageToTab(message: BrowserMessage) {
  try {
    const tab = await getActiveTab()

    if (!tab || !tab.id) throw new Error('No active tab found to send msg')

    browserPolyfill.tabs.sendMessage(tab.id, message)
    console.debug('message sent to tab', message)
  } catch (error) {
    console.debug('error sending sync message', error, message)
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
    console.debug('sending browser message', message)
    await browserPolyfill.runtime.sendMessage(message)
  } catch (error) {
    console.debug('error sending browser message', error, message)
  }
}

export interface BrowserMessage {
  type:
    | 'sync'
    | 'findVideo'
    | 'checkForVideo'
    | 'play'
    | 'pause'
    | 'getSocketStatus'
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
