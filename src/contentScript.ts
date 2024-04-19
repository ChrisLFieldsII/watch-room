// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts

import browser from 'webextension-polyfill'
import { nanoid } from 'nanoid'

import { SocketController, SocketEventData } from './socket.controller'
import { VideoController } from './video.controller'

console.debug('Content script loaded')

/**
 * normally we dont want to skip the emit b/c we want to emit the event that the user triggered,
 * but when reacting to a socket event, we dont want to emit the event again
 */
let skipEmit = false

const videoController = new VideoController().init({
  eventHandlers: {
    play: () => {
      socketController.emit(
        'playVideo',
        {
          time: videoController.getVideoTime(),
        },
        skipEmit,
      )

      // NOTE: must ensure that we reset the skipEmit flag after emitting the event
      skipEmit = false
    },
    pause: () => {
      socketController.emit(
        'pauseVideo',
        {
          time: videoController.getVideoTime(),
        },
        skipEmit,
      )

      skipEmit = false
    },
    ended: () => {},
    seeked: () => {},
  },
})

const socketController = new SocketController().init({
  uri: 'http://localhost:3000',
  userId: nanoid(),
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
