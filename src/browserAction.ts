// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction
import browser from 'webextension-polyfill'
import $ from 'jquery'

import {
  STORAGE_KEYS,
  getStorageValues,
  createRoomId,
  sendMessageToTab,
} from './utils'

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

function renderSyncBtn() {
  const syncBtn = $('<button class="block">Sync URL</button>')
  syncBtn.prop('title', 'Sync the current tab with other users in the room')
  syncBtn.on('click', async () => {
    sendMessageToTab({ type: 'sync' })
  })

  $('body').append(syncBtn)
}

function renderFoundVideo(foundVideo: boolean) {
  const foundVideoEle = $(`<p>Found Video: ${foundVideo}</p>`)
  if (!foundVideo) {
    const findVideoBtn = $('<button class="ml-4">Find Video</button>')
    findVideoBtn.prop(
      'title',
      'Find the video element on the page for the extension to work',
    )
    findVideoBtn.on('click', async () => {
      sendMessageToTab({ type: 'findVideo' })
    })
    foundVideoEle.append(findVideoBtn)
  }

  $('body').append(foundVideoEle)
}

async function main() {
  const { roomId, enabled, foundVideo } = await getStorageValues()

  const roomIdEle = renderRoomId(roomId)

  renderEnableCheckbox(enabled)

  renderFoundVideo(foundVideo)

  const setRoomId = async (newRoomId: string) => {
    roomIdEle.text(`Room ID: ${newRoomId}`)
    await browser.storage.local.set({ [STORAGE_KEYS.ROOM_ID]: newRoomId })
  }

  renderCreateRoomBtn({
    onClick: () => {
      const newRoomId = createRoomId()
      setRoomId(newRoomId)
    },
  })

  renderJoinRoomInput({
    onClick: (newRoomId) => {
      setRoomId(newRoomId)
    },
  })

  renderSyncBtn()
}

main()
  .then(() => console.debug('browser action script ran successfully'))
  .catch((error) => console.debug('error running browser action script', error))
