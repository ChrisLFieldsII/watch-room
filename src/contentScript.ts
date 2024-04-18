// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts

import browser from 'webextension-polyfill'
import $ from 'jquery'
import { nanoid } from 'nanoid'

import { SocketController, EventData } from './socket.controller'

console.debug('Content script loaded')

const video = $<HTMLVideoElement>('video')
console.debug('video', video)

function getVideoTime() {
  return video.prop('currentTime')
}

function setVideoTime(time: number) {
  video.prop('currentTime', time)
}

let shouldEmitOnPlay = true
video.on('play', () => {
  console.debug('HTML video "play" event', getVideoTime())

  if (shouldEmitOnPlay) {
    socketController.emit('playVideo', { time: getVideoTime() })
  }
  shouldEmitOnPlay = true
})

video.on('pause', () => {
  console.debug('HTML video "pause" event', getVideoTime())
})

video.on('ended', () => {
  console.debug('HTML video "ended" event', getVideoTime())
})

video.on('seeked', () => {
  console.debug('HTML video "seeked" event', getVideoTime())
})

const socketController = new SocketController().init({
  uri: 'http://localhost:3000',
  userId: nanoid(),
  eventHandlers: {
    playVideo: (data: EventData<'playVideo'>) => {
      shouldEmitOnPlay = false

      video
        .get(0)
        ?.play()
        .then(() => {
          // set video time only works after play is called
          setVideoTime(data.time)
          console.debug('video play success', getVideoTime())
        })
        .catch((error) => console.error('video play error', error))
    },
  },
})
