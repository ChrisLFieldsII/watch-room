import {
  BrowserMessage,
  GetSocketStatusData,
  STORAGE_KEYS,
  getBrowser,
  getStorageValues,
  sendMessageToTab,
} from './utils'
import { SocketController, SocketEventData } from './socket.controller'
import browser from 'webextension-polyfill'

// NOTE: events MUST be declared at global scope. https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/events

console.debug('browser type', getBrowser())

// socket listens for events and sends message to tab
const socketController = new SocketController({
  uri: 'http://localhost:3000', // TODO: move to env var
  // chrome can use websockets fine, but specifying and specific transport doesnt seem to work for firefox. passing undefined and let socket.io client figure out the transport
  transports: getBrowser() === 'Chrome' ? ['websocket'] : undefined,
  eventHandlers: {
    playVideo: (data: SocketEventData<'playVideo'>) => {
      /* 
        normally we dont want to skip the emit, but when reacting to a socket event, we dont want to emit the event again when video plays/pauses/syncs/etc
      */
      sendMessageToTab({ type: 'play', data: { ...data, skipEmit: true } })
    },
    pauseVideo: (data: SocketEventData<'pauseVideo'>) => {
      sendMessageToTab({ type: 'pause', data: { ...data, skipEmit: true } })
    },
    sync: async (data: SocketEventData<'sync'>) => {
      sendMessageToTab({ type: 'sync', data: { ...data, skipEmit: true } })
    },
    heartbeat: () => {
      console.debug('received heartbeat')
    },
  },
})

browser.runtime.onMessage.addListener((message: BrowserMessage) => {
  console.debug('received browser message', message)
  if (message.type === 'play') {
    socketController.emit('playVideo', message.data)
  }
  if (message.type === 'pause') {
    socketController.emit('pauseVideo', message.data)
  }
  if (message.type === 'sync') {
    socketController.emit('sync', message.data)
  }
})

browser.storage.onChanged.addListener((changes) => {
  console.debug('storage changed', changes)
  if (changes[STORAGE_KEYS.ROOM_ID]) {
    socketController.setRoomId(changes.roomId.newValue)
  }
  if (changes[STORAGE_KEYS.ENABLED]) {
    const isEnabled = changes.enabled.newValue as boolean
    socketController.setEnabled(isEnabled)
  }
})

browser.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((message: BrowserMessage) => {
    console.debug('service worker received port message', message)
    if (message.type === 'getSocketStatus') {
      port.postMessage({
        type: 'getSocketStatus',
        data: {
          isConnected: socketController.isConnected(),
        } satisfies GetSocketStatusData,
      } satisfies BrowserMessage)
    }
  })
})

async function main() {
  const { roomId, userId, enabled } = await getStorageValues()
  socketController.setRoomId(roomId)
  socketController.setUserId(userId)
  socketController.setEnabled(enabled)
}

main()
  .then(() => console.debug('service worker initialized'))
  .catch((error) => console.error('service worker init error', error))
