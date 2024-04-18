// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts

import browser from 'webextension-polyfill'
import $ from 'jquery'
import { io } from 'socket.io-client'
import { nanoid } from 'nanoid'

console.debug('Content script loaded')

const socket = io('http://localhost:3000', { transports: ['websocket'] })

const userId = nanoid()

const video = $<HTMLVideoElement>('video')
console.debug('video', video)

let shouldEmitOnPlay = true

function getVideoTime() {
  return video.prop('currentTime')
}

function setVideoTime(time: number) {
  video.prop('currentTime', time)
}

video.on('play', () => {
  console.debug('video play', getVideoTime())
  if (shouldEmitOnPlay) {
    socket.emit('events', {
      type: 'playVideo',
      data: { time: getVideoTime(), userId },
    })
  }
  shouldEmitOnPlay = true
})

video.on('pause', () => {
  console.debug('video pause', getVideoTime())
})

video.on('ended', () => {
  console.debug('video ended', getVideoTime())
})

video.on('seeked', () => {
  console.debug('video seeked', getVideoTime())
})

socket
  .on('connect', () => {
    console.debug(socket.id)

    socket.on('events', (event: { type: string; data: any }) => {
      console.debug('received event', event)
      const { type, data } = event

      if (data.userId === userId) {
        console.debug('event from self, ignoring...')
        return
      }

      if (type === 'playVideo') {
        shouldEmitOnPlay = false
        // setVideoTime(data.time)
        video
          .get(0)
          ?.play()
          .then(() => {
            // set video time only works after play is called
            setVideoTime(data.time)
            console.debug('video play success', getVideoTime())
          })
          .catch((error) => console.error('video play error', error))
      }
    })
  })
  .on('connect_error', (error) => {
    if (socket.active) {
      // temporary failure, the socket will automatically try to reconnect
      console.debug(
        'temporary socket connection error. socket is reconnecting...',
      )
    } else {
      // the connection was denied by the server
      // in that case, `socket.connect()` must be manually called in order to reconnect
      window.alert(
        `Failed to establish socket connection to server: ${error.message}`,
      )
    }
  })
