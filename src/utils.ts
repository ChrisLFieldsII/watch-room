import browser from 'webextension-polyfill'
import { customAlphabet } from 'nanoid'

// nanoid util generator - https://zelark.github.io/nano-id-cc/
const alphabet =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
export const createRoomId = customAlphabet(alphabet, 8)

export const STORAGE_KEYS = {
  ROOM_ID: 'roomId',
  ENABLED: 'enabled',
}

export async function getStorageValues() {
  let { roomId, enabled = false } = (await browser.storage.local.get([
    STORAGE_KEYS.ROOM_ID,
    STORAGE_KEYS.ENABLED,
  ])) as {
    roomId?: string
    enabled?: boolean
  }
  console.debug('storage', { roomId, enabled })

  // generate a room id if one doesn't exist
  if (!roomId) {
    console.debug('No roomId found in storage, generating one...')
    roomId = createRoomId()
    await browser.storage.local.set({ [STORAGE_KEYS.ROOM_ID]: roomId })
  }
  console.debug('Retrieved roomId from storage', roomId)

  return { roomId, enabled }
}
