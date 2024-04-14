// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts

import browser from 'webextension-polyfill'
import $ from 'jquery'

console.log('Content script loaded')

const video = $('video')
console.log('video', video)
