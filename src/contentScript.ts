// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts

import browser from 'webextension-polyfill'
import $ from 'jquery'

console.log('Content script loaded')

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
