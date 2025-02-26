import {
  BrowserMessage,
  GetSocketStatusData,
  STORAGE_KEYS,
  getBrowser,
  getStorageValues,
  logger,
  sendMessageToTab,
} from './utils'
import {
  SocketController,
  SocketEventData,
} from './controllers/socket.controller'
import browser from 'webextension-polyfill'

// NOTE: events MUST be declared at global scope. https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/events

logger.log('browser type', getBrowser())
logger.log('SERVER_URI', process.env.SERVER_URI)

// socket listens for events and sends message to tab
const socketController = new SocketController({
  uri: process.env.SERVER_URI!, // TODO: move to env var
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
    seekedVideo: (data: SocketEventData<'seekedVideo'>) => {
      sendMessageToTab({ type: 'seeked', data: { ...data, skipEmit: true } })
    },
    sync: async (data: SocketEventData<'sync'>) => {
      sendMessageToTab({ type: 'sync', data: { ...data, skipEmit: true } })
    },
    playbackRateChanged: (data: SocketEventData<'playbackRateChanged'>) => {
      sendMessageToTab({
        type: 'playbackRateChanged',
        data: { ...data, skipEmit: true },
      })
    },
    heartbeat: () => {
      logger.log('received heartbeat')
    },
    joinRoom: (data: SocketEventData<'joinRoom'>) => {
      logger.log('joining room', data)
    },
    leaveRoom: (data: SocketEventData<'leaveRoom'>) => {
      logger.log('leaving room', data)
    },
  },
})

// listens for msgs sent by VideoController in contentScript
browser.runtime.onMessage.addListener((message: BrowserMessage) => {
  logger.log('received browser message', message)
  if (message.type === 'play') {
    socketController.emit('playVideo', message.data)
  }
  if (message.type === 'pause') {
    socketController.emit('pauseVideo', message.data)
  }
  if (message.type === 'sync') {
    socketController.emit('sync', message.data)
  }
  if (message.type === 'seeked') {
    socketController.emit('seekedVideo', message.data)
  }
  if (message.type === 'playbackRateChanged') {
    socketController.emit('playbackRateChanged', message.data)
  }
})

browser.storage.onChanged.addListener((changes) => {
  logger.log('storage changed', changes)
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
    logger.log('service worker received port message', message)
    if (message.type === 'getSocketStatus') {
      port.postMessage({
        type: 'getSocketStatus',
        data: {
          isConnected: socketController.isConnected(),
        } satisfies GetSocketStatusData,
      } satisfies BrowserMessage)
    }

    if (message.type === 'attemptConnectSocket') {
      if (!socketController.isConnected()) {
        socketController.connect()
      }

      setTimeout(() => {
        port.postMessage({
          type: 'getSocketStatus',
          data: {
            isConnected: socketController.isConnected(),
          } satisfies GetSocketStatusData,
        } satisfies BrowserMessage)
      }, 1000)
    }
  })
})

async function main() {
  const { roomId, userId, enabled } = await getStorageValues()
  // NOTE: currently a nasty race condition but setRoomId must be called before setEnabled, which calls connect(), which emits joinRoom event where the roomId is needed
  socketController.setRoomId(roomId)
  socketController.setUserId(userId)
  socketController.setEnabled(enabled)
}

main()
  .then(() => logger.log('service worker initialized'))
  .catch((error) => console.error('service worker init error', error))
