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
import { STORAGE_KEYS } from './utils'

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

  const { roomId = '' } = (await browser.storage.local.get(
    STORAGE_KEYS.ROOM_ID,
  )) as { roomId?: string }

  const videoController = new VideoController().init({
    eventHandlers: {
      play: () => {
        emit('playVideo', { time: videoController.getVideoTime() })
      },
      pause: () => {
        emit('pauseVideo', { time: videoController.getVideoTime() })
      },
      ended: () => {},
      seeked: () => {},
    },
  })

  const socketController = new SocketController().init({
    uri: 'http://localhost:3000', // TODO: move to env var
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
    },
  })

  browser.storage.onChanged.addListener((changes) => {
    if (changes[STORAGE_KEYS.ROOM_ID]) {
      console.debug('roomId changed', changes.roomId.newValue)
      socketController.setRoomId(changes.roomId.newValue)
    }
  })
}

main()
  .then(() => console.debug('content script loaded'))
  .catch((error) => console.debug('content script error', error))
