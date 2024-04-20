// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction
import browser from 'webextension-polyfill'
import $ from 'jquery'
import { customAlphabet } from 'nanoid'
import { STORAGE_KEYS } from './utils'

// nanoid util generator - https://zelark.github.io/nano-id-cc/
const alphabet =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const nanoid = customAlphabet(alphabet, 8)

console.debug('Loaded browser action script.')

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

  const setRoomId = async (newRoomId: string) => {
    roomIdEle.text(`Room ID: ${newRoomId}`)
    await browser.storage.local.set({ [STORAGE_KEYS.ROOM_ID]: newRoomId })
  }

  const createBtn = $('<button class="block">Create New Room</button>')
  createBtn.on('click', async () => {
    const newRoomId = nanoid()
    setRoomId(newRoomId)
  })
  $('body').append(createBtn)

  // render join input
  const joinInput = $(
    '<input type="text" placeholder="Enter Room ID to join" />',
  )
  const joinBtn = $('<button>Join Room</button>')
  joinBtn.on('click', async () => {
    const newRoomId = joinInput.val() as string
    setRoomId(newRoomId)
  })
  $('body').append(joinInput).append(joinBtn)
}

main()
  .then(() => console.debug('browser action script ran successfully'))
  .catch((error) => console.debug('error running browser action script', error))
