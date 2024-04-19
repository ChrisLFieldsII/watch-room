// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction
import browser from 'webextension-polyfill'
import $ from 'jquery'
import { customAlphabet } from 'nanoid'

// nanoid util generator - https://zelark.github.io/nano-id-cc/
const alphabet =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const nanoid = customAlphabet(alphabet, 8)

console.debug('Loaded browser action script.')

const STORAGE_KEYS = {
  ROOM_ID: 'roomId',
}

async function main() {
  // try to get room id
  let { roomId } = (await browser.storage.local.get(STORAGE_KEYS.ROOM_ID)) as {
    roomId?: string
  }

  // generate a room id if one doesn't exist
  if (!roomId) {
    console.debug('No roomId found in storage, generating one...')
    roomId = nanoid()
    await browser.storage.local.set({ [STORAGE_KEYS.ROOM_ID]: roomId })
  }
  console.debug('Retrieved roomId from storage', roomId)

  // render room id
  const roomIdEle = $(`<p>Room ID: ${roomId}</p>`)
  $('body').append(roomIdEle)

  // render join input
  const joinInput = $(
    '<input type="text" placeholder="Enter Room ID to join" />',
  )
  const joinBtn = $('<button>Join Room</button>')
  $('body').append(joinInput).append(joinBtn)
}

main()
  .then(() => console.debug('browser action script ran successfully'))
  .catch((error) => console.debug('error running browser action script', error))
