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
  GetSocketStatusData,
} from './utils'

const extensionPort = browser.runtime.connect()
let tabPort: browser.Runtime.Port | null = null

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
    const newRoomId = joinInput.val() as string
    if (!newRoomId) return
    onClick(newRoomId)
  })
}

function renderSyncBtn() {
  const syncBtn = $('#sync-url-btn')
  syncBtn.on('click', async () => {
    sendMessageToTab({ type: 'sync' })
  })
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

function renderPowerBtn(enabled: boolean) {
  const syncEnabledEle = $('#power-icon')
  const connectBtn = $('#connect-socket-btn')
  const findVideoBtn = $('#find-video-btn')

  const enable = () => {
    syncEnabledEle.removeClass('icon-off')
    syncEnabledEle.addClass('icon-on')
  }
  const disable = () => {
    syncEnabledEle.removeClass('icon-on')
    syncEnabledEle.addClass('icon-off')

    // ensure status buttons are hidden
    connectBtn.addClass('hidden')
    findVideoBtn.addClass('hidden')
  }

  if (enabled) {
    enable()
  } else {
    disable()
  }

  syncEnabledEle.on('click', async () => {
    const newEnabled = !syncEnabledEle.hasClass('icon-on')
    console.debug('Sync enabled clicked', newEnabled)
    browser.storage.local.set({ [STORAGE_KEYS.ENABLED]: newEnabled })
    if (newEnabled) {
      enable()
    } else {
      disable()
    }

    setTimeout(() => {
      extensionPort.postMessage({
        type: 'getSocketStatus',
      } satisfies BrowserMessage)

      tabPort?.postMessage({ type: 'checkForVideo' })
    }, 1000)
  })
}

async function renderSocketStatus(isConnected: boolean) {
  const { enabled } = await getStorageValues()
  const iconOff = $('#socket-status-icon-off')
  const iconOn = $('#socket-status-icon-on')
  const connectBtn = $('#connect-socket-btn')

  if (isConnected) {
    iconOff.addClass('hidden')
    iconOn.removeClass('hidden')
    connectBtn.addClass('hidden')
  } else {
    iconOff.removeClass('hidden')
    iconOn.addClass('hidden')

    // extension is enabled but no video found, render button to try and find it
    if (enabled) {
      connectBtn.removeClass('hidden')
      connectBtn.on('click', async () => {
        extensionPort.postMessage({
          type: 'attemptConnectSocket',
        } satisfies BrowserMessage)
      })
    }
  }
}

async function renderVideoStatus(foundVideo: boolean) {
  const { enabled } = await getStorageValues()
  const iconOff = $('#video-status-icon-off')
  const iconOn = $('#video-status-icon-on')
  const findVideoBtn = $('#find-video-btn')

  if (foundVideo) {
    iconOff.addClass('hidden')
    iconOn.removeClass('hidden')
    findVideoBtn.addClass('hidden')
  } else {
    iconOff.removeClass('hidden')
    iconOn.addClass('hidden')

    // extension is enabled but no video found, render button to try and find it
    if (enabled) {
      findVideoBtn.removeClass('hidden')
      findVideoBtn.on('click', async () => {
        sendMessageToTab({ type: 'findVideo' } satisfies BrowserMessage)
      })
    }
  }
}

async function main() {
  const { roomId, enabled } = await getStorageValues()

  const roomIdEle = renderRoomId(roomId)
  hookupCopyRoomId()

  renderPowerBtn(enabled)

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
    tabPort = browser.tabs.connect(tab.id)
    // post checkForVideo message to content script
    tabPort.postMessage({ type: 'checkForVideo' })

    // listen for content script to respond
    tabPort.onMessage.addListener((message: BrowserMessage) => {
      if (message.type === 'checkForVideo') {
        renderVideoStatus(message.data)
      }
    })
  }

  extensionPort.postMessage({
    type: 'getSocketStatus',
  } satisfies BrowserMessage)

  extensionPort.onMessage.addListener((message: BrowserMessage) => {
    console.debug('action received port message', message)
    if (message.type === 'getSocketStatus') {
      const data = message.data as GetSocketStatusData

      renderSocketStatus(data.isConnected)
    }
  })
}

main()
  .then(() => console.debug('browser action script ran successfully'))
  .catch((error) => console.debug('error running browser action script', error))
