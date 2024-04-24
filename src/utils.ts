import browser from 'webextension-polyfill'
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
  const storage = (await browser.storage.local.get([
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
    await browser.storage.local.set({ [STORAGE_KEYS.ROOM_ID]: roomId })
  }
  if (!userId) {
    console.debug('No userId found in storage, generating one...')
    userId = nanoid()
    await browser.storage.local.set({ [STORAGE_KEYS.USER_ID]: userId })
  }
  console.debug('storage', { roomId, enabled, userId })

  return { roomId, enabled, userId }
}

export async function sendMessageToTab(message: any) {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })
  for (const tab of tabs) {
    browser.tabs
      .sendMessage(tab.id as number, message)
      .then(() => console.debug('message sent to tab', message))
      .catch((error) => console.debug('error sending sync message', error))
  }
}

export async function getActiveTab() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
  console.debug('got active tab', tab)
  return tab
}

export interface BrowserMessage {
  type: 'sync' | 'findVideo' | 'checkForVideo'
  data: any
}
