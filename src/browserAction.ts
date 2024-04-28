// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction
import browser from 'webextension-polyfill'
import $ from 'jquery'

import {
  STORAGE_KEYS,
  getStorageValues,
  createRoomId,
  sendMessageToTab,
  getActiveTab,
  BrowserMessage,
} from './utils'

function renderRoomId(roomId: string) {
  const roomIdEle = $('#room-id')
  roomIdEle.text(roomId)
  return roomIdEle
}

function renderCreateRoomBtn({ onClick }: { onClick: Function }) {
  const createBtn = $('#create-room-btn')
  createBtn.on('click', async () => {
    onClick()
  })
}

function renderJoinRoomInput({
  onClick,
}: {
  onClick: (roomId: string) => void
}) {
  const joinInput = $('#join-room-input')
  const joinBtn = $('#join-room-btn')
  joinBtn.on('click', async () => {
    onClick(joinInput.val() as string)
  })
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
  const foundVideoEle = $(
    `<p id='foundVideoEle'>Found Video: ${foundVideo}</p>`,
  )
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

function hookupCopyRoomId() {
  const roomIdContainer = $('#room-id-container')
  roomIdContainer.on('click', async () => {
    try {
      const roomId = $('#room-id').text()
      navigator.clipboard.writeText(roomId)
      const copyIcon = $('#copy-icon')
      const checkIcon = $('#check-icon')
      copyIcon.addClass('hidden')
      checkIcon.removeClass('hidden')
      setTimeout(() => {
        copyIcon.removeClass('hidden')
        checkIcon.addClass('hidden')
      }, 2000)
    } catch (error) {
      console.error('Error copying to clipboard', error)
    }
  })
}

function renderSyncEnabled(enabled: boolean) {
  const syncEnabledEle = $('#power-icon')

  const enable = () => {
    syncEnabledEle.removeClass('power-icon-off')
    syncEnabledEle.addClass('power-icon-on')
  }
  const disable = () => {
    syncEnabledEle.removeClass('power-icon-on')
    syncEnabledEle.addClass('power-icon-off')
  }

  if (enabled) {
    enable()
  } else {
    disable()
  }

  syncEnabledEle.on('click', async () => {
    const newEnabled = !syncEnabledEle.hasClass('power-icon-on')
    console.debug('Sync enabled clicked', newEnabled)
    browser.storage.local.set({ [STORAGE_KEYS.ENABLED]: newEnabled })
    if (newEnabled) {
      enable()
    } else {
      disable()
    }
  })
}

async function main() {
  const { roomId, enabled } = await getStorageValues()

  const roomIdEle = renderRoomId(roomId)
  hookupCopyRoomId()

  renderSyncEnabled(enabled)

  const setRoomId = async (newRoomId: string) => {
    roomIdEle.text(newRoomId)
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

  // set up 2 way connection between action and content script
  const tab = await getActiveTab()
  if (tab?.id !== undefined) {
    const port = browser.tabs.connect(tab.id)
    // post checkForVideo message to content script
    port.postMessage({ type: 'checkForVideo' })

    // listen for content script to respond
    port.onMessage.addListener((message: BrowserMessage) => {
      if (message.type === 'checkForVideo') {
        $('#foundVideoEle').remove()
        renderFoundVideo(message.data)
      }
    })
  }
}

main()
  .then(() => console.debug('browser action script ran successfully'))
  .catch((error) => console.debug('error running browser action script', error))
