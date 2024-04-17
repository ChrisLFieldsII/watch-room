// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts

import browser from 'webextension-polyfill'
import $ from 'jquery'
import { io } from 'socket.io-client'

console.log('Content script loaded')

const socket = io('http://localhost:3000', { transports: ['websocket'] })

socket.on('connect_error', (error) => {
  console.log('socket connect_error', error.message)
  if (socket.active) {
    // temporary failure, the socket will automatically try to reconnect
  } else {
    // the connection was denied by the server
    // in that case, `socket.connect()` must be manually called in order to reconnect
    console.log(error.message)
  }
})
socket.on('connect', () => {
  console.log(socket.id)

  socket.emit('events', { test: 'test' })
})
socket.on('events', (data) => {
  console.log('events', data)
})

const video = $<HTMLVideoElement>('video')
console.log('video', video)

function getVideoTime() {
  return video.prop('currentTime')
}

function setVideoTime(time: number) {
  video.prop('currentTime', time)
}

video.on('play', () => {
  console.log('video play', getVideoTime())
})

video.on('pause', () => {
  console.log('video pause', getVideoTime())
})

video.on('ended', () => {
  console.log('video ended', getVideoTime())
})

video.on('seeked', () => {
  console.log('video seeked', getVideoTime())
})
