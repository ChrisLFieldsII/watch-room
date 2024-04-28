// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts

import browser from 'webextension-polyfill'

import { VideoController } from './video.controller'
import {
  BrowserMessage,
  STORAGE_KEYS,
  getStorageValues,
  isDocumentVisible,
  sendBrowserMessage,
} from './utils'

/**
 * normally we dont want to skip the emit,
 * but when reacting to a socket event, we dont want to emit the event again
 */
let skipEmit = false

/**
 * helper to handle skipEmit logic
 */
function sendBrowserMessageWrapper(message: BrowserMessage) {
  if (skipEmit) {
    skipEmit = false
    return
  }

  sendBrowserMessage(message)
}

async function main() {
  const { enabled } = await getStorageValues()

  // video controller sends messages to the service worker for the socket to emit
  const videoController = new VideoController({
    enabled,
    eventHandlers: {
      play: () => {
        sendBrowserMessageWrapper({
          type: 'play',
          data: { time: videoController.getVideoTime() },
        })
      },
      pause: () => {
        sendBrowserMessageWrapper({
          type: 'pause',
          data: { time: videoController.getVideoTime() },
        })
      },
    },
  })

  // storage change listener
  browser.storage.onChanged.addListener((changes) => {
    console.debug('storage changed', changes)

    if (changes[STORAGE_KEYS.ENABLED]) {
      const isEnabled = changes.enabled.newValue as boolean
      videoController.setEnabled(isEnabled)
    }
  })

  let thePort: browser.Runtime.Port | null = null

  // 1-way message listener. listens for msgs from the extension popup
  browser.runtime.onMessage.addListener((message: BrowserMessage) => {
    if (!isDocumentVisible()) {
      console.debug('received message but document is not visible', message)
      return
    }

    console.debug('received browser message in content script', message)
    const { type, data = {} } = message

    // service worker messages will include whether we should skipEmit or not
    skipEmit = data.skipEmit || false

    if (type === 'findVideo') {
      videoController.findVideo()
      thePort?.postMessage({
        type: 'checkForVideo',
        data: videoController.hasVideo(),
      })
    }
    if (type === 'play') {
      videoController.play(data.time)
    }
    if (type === 'pause') {
      videoController.pause(data.time)
    }
    if (type === 'sync') {
      // received msg from popup, send it to background script for socket to emit
      if (!data.url) {
        sendBrowserMessageWrapper({
          type: 'sync',
          data: { url: window.location.href },
        })
      }
      // received msg from service worker socket event, sync the video
      else {
        videoController.sync(data.url)
      }
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

/** this delay helps the page and hopefully video load before trying to inject the content script */
const DELAY_SEC = 2

setTimeout(() => {
  main()
    .then(() => console.debug('content script loaded'))
    .catch((error) => console.debug('content script error', error))
}, 1000 * DELAY_SEC)
