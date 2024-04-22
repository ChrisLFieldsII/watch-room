// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts

import browser from 'webextension-polyfill'
import { nanoid } from 'nanoid'

import {
  SocketController,
  SocketEventData,
  RawSocketEventData,
  SocketEventKey,
} from './socket.controller'
import { VideoController } from './video.controller'
import { STORAGE_KEYS, getStorageValues } from './utils'

/**
 * normally we dont want to skip the emit,
 * but when reacting to a socket event, we dont want to emit the event again
 */
let skipEmit = false

async function main() {
  /**
   * helper to handle skipEmit logic
   */
  function emit<T extends SocketEventKey>(key: T, data: RawSocketEventData<T>) {
    socketController.emit(key, data, skipEmit)

    // NOTE: must ensure that we reset the skipEmit flag after emitting the event
    skipEmit = false
  }

  const { roomId, enabled } = await getStorageValues()

  const videoController = new VideoController().init({
    enabled,
    eventHandlers: {
      play: () => {
        emit('playVideo', { time: videoController.getVideoTime() })
      },
      pause: () => {
        emit('pauseVideo', { time: videoController.getVideoTime() })
      },
    },
  })

  const socketController = new SocketController().init({
    uri: 'http://localhost:3000', // TODO: move to env var
    enabled,
    userId: nanoid(),
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
      sync: (data: SocketEventData<'sync'>) => {
        skipEmit = true

        videoController.sync(data.url)
      },
    },
  })

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

  browser.runtime.onMessage.addListener((message: BrowserMessage) => {
    console.debug('received message', message)
    if (message.type === 'sync') {
      emit('sync', { url: window.location.href })
    }
  })
}

// NOTE: setTimeout is a hacky way to ensure that the content script runs after the page has loaded so it can find a video element. may need a findVideo button to manually find the video element
setTimeout(() => {
  main()
    .then(() => console.debug('content script loaded'))
    .catch((error) => console.debug('content script error', error))
}, 3000)

interface BrowserMessage {
  type: 'sync'
  data: any
}
