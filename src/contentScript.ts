// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts

import browser from 'webextension-polyfill'
import { nanoid } from 'nanoid'

import { SocketController, SocketEventData } from './socket.controller'
import { VideoController } from './video.controller'

console.debug('Content script loaded')

let shouldEmitOnPlay = true

const videoController = new VideoController().init({
  eventHandlers: {
    play: () => {
      if (shouldEmitOnPlay) {
        socketController.emit('playVideo', {
          time: videoController.getVideoTime(),
        })
      }
      shouldEmitOnPlay = true
    },
    ended: () => {},
    pause: () => {},
    seeked: () => {},
  },
})

const socketController = new SocketController().init({
  uri: 'http://localhost:3000',
  userId: nanoid(),
  eventHandlers: {
    playVideo: (data: SocketEventData<'playVideo'>) => {
      shouldEmitOnPlay = false

      videoController.play(data.time)
    },
  },
})
