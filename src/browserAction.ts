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

async function getStorageValues() {
  let { roomId, enabled } = (await browser.storage.local.get([
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
    roomId = nanoid()
    await browser.storage.local.set({ [STORAGE_KEYS.ROOM_ID]: roomId })
  }
  console.debug('Retrieved roomId from storage', roomId)

  return { roomId, enabled }
}

function renderRoomId(roomId: string) {
  const roomIdEle = $(`<p>Room ID: ${roomId}</p>`)
  $('body').append(roomIdEle)
  return roomIdEle
}

function renderEnableCheckbox(enabled: boolean = false) {
  const enableCheckbox = $('<input type="checkbox" />')
  const enableLabel = $('<label>Enable Sync</label>')
  enableLabel.prepend(enableCheckbox)
  $('body').append(enableLabel)
  enableCheckbox.prop('checked', enabled)
  enableCheckbox.on('change', () => {
    const checked = enableCheckbox.prop('checked')
    console.debug('Enable checkbox changed', checked)
    browser.storage.local.set({ [STORAGE_KEYS.ENABLED]: checked })
  })
}

function renderCreateRoomBtn({ onClick }: { onClick: Function }) {
  const createBtn = $('<button class="block">Create New Room</button>')
  createBtn.on('click', async () => {
    onClick()
  })
  $('body').append(createBtn)
}

function renderJoinRoomInput({
  onClick,
}: {
  onClick: (roomId: string) => void
}) {
  const joinInput = $(
    '<input type="text" placeholder="Enter Room ID to join" />',
  )
  const joinBtn = $('<button>Join Room</button>')
  joinBtn.on('click', async () => {
    onClick(joinInput.val() as string)
  })
  $('body').append(joinInput).append(joinBtn)
}

async function main() {
  const { roomId, enabled } = await getStorageValues()

  const roomIdEle = renderRoomId(roomId)

  renderEnableCheckbox(enabled)

  const setRoomId = async (newRoomId: string) => {
    roomIdEle.text(`Room ID: ${newRoomId}`)
    await browser.storage.local.set({ [STORAGE_KEYS.ROOM_ID]: newRoomId })
  }

  renderCreateRoomBtn({
    onClick: () => {
      const newRoomId = nanoid()
      setRoomId(newRoomId)
    },
  })

  renderJoinRoomInput({
    onClick: (newRoomId) => {
      setRoomId(newRoomId)
    },
  })
}

main()
  .then(() => console.debug('browser action script ran successfully'))
  .catch((error) => console.debug('error running browser action script', error))
