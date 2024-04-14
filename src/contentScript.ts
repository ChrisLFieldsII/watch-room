// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts

console.log('importing browser')
// import browser from 'webextension-polyfill'
const browser = require('webextension-polyfill')
console.log('This is content script.', browser)
