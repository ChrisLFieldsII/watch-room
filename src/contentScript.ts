// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts

import browser from 'webextension-polyfill'

import {
  SocketController,
  SocketEventData,
  RawSocketEventData,
  SocketEventKey,
} from './socket.controller'
import { VideoController } from './video.controller'
import {
  BrowserMessage,
  STORAGE_KEYS,
  getStorageValues,
  isDocumentVisible,
} from './utils'

/**
 * normally we dont want to skip the emit,
 * but when reacting to a socket event, we dont want to emit the event again
 */
let skipEmit = false

async function main() {
  const { userId } = await getStorageValues()

  /**
   * helper to handle skipEmit logic
   */
  function emit<T extends SocketEventKey>(key: T, data: RawSocketEventData<T>) {
    socketController.emit(key, data, skipEmit)

    // NOTE: must ensure that we reset the skipEmit flag after emitting the event
    skipEmit = false
  }

  const { roomId, enabled } = await getStorageValues()

  const videoController = new VideoController({
    enabled,
    eventHandlers: {
      play: () => {
        emit('playVideo', { time: videoController.getVideoTime() })
      },
      pause: () => {
        emit('pauseVideo', { time: videoController.getVideoTime() })
      },
    },
  }).findVideo()

  const socketController = new SocketController({
    uri: 'http://localhost:3000', // TODO: move to env var
    enabled,
    userId,
    roomId,
    eventHandlers: {
      playVideo: (data: SocketEventData<'playVideo'>) => {
        // dont want to emit b/c below play call will trigger the VideoController play event which would emit the play event again
        skipEmit = true

        videoController.play(data.time)
      },
      pauseVideo: (data: SocketEventData<'pauseVideo'>) => {
        skipEmit = true

        videoController.pause(data.time)
      },
      sync: async (data: SocketEventData<'sync'>) => {
        skipEmit = true

        if (isDocumentVisible()) {
          videoController.sync(data.url)
        }
      },
    },
  }).connect()

  // storage change listener
  browser.storage.onChanged.addListener((changes) => {
    console.debug('storage changed', changes)
    if (changes[STORAGE_KEYS.ROOM_ID]) {
      socketController.setRoomId(changes.roomId.newValue)
    }
    if (changes[STORAGE_KEYS.ENABLED]) {
      const isEnabled = changes.enabled.newValue as boolean
      socketController.setEnabled(isEnabled)
      videoController.setEnabled(isEnabled)
    }
  })

  let thePort: browser.Runtime.Port | null = null

  // 1-way message listener. listens for msgs from the extension popup
  browser.runtime.onMessage.addListener((message: BrowserMessage) => {
    console.debug('received message', message)
    if (message.type === 'sync') {
      emit('sync', { url: window.location.href })
    }
    if (message.type === 'findVideo') {
      videoController.findVideo()
      thePort?.postMessage({
        type: 'checkForVideo',
        data: videoController.hasVideo(),
      })
    }
  })

  // 2-way connection between popup and content script
  browser.runtime.onConnect.addListener((port) => {
    thePort = port

    port.onMessage.addListener((message: BrowserMessage) => {
      console.debug('port message', message)
      if (message.type === 'checkForVideo') {
        console.debug('checking for video element')
        port.postMessage({
          type: 'checkForVideo',
          data: videoController.hasVideo(),
        })
      }
    })
  })
}

main()
  .then(() => console.debug('content script loaded'))
  .catch((error) => console.debug('content script error', error))
