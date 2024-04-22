// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction
import browser from 'webextension-polyfill'
import $ from 'jquery'

import { STORAGE_KEYS, getStorageValues, createRoomId } from './utils'

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
    console.debug('sync button clicked')
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    for (const tab of tabs) {
      console.debug('sending sync message to tab', tab)
      browser.tabs
        .sendMessage(tab.id as number, { type: 'sync' })
        .then(() => console.debug('sync message sent'))
        .catch((error) => console.debug('error sending sync message', error))
    }
  })
  $('body').append(syncBtn)
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
