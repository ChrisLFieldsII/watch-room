import browser from 'webextension-polyfill'
import { logger } from './utils'

async function main() {
  const scriptEle = document.createElement('script')
  const src = browser.runtime.getURL('dist/netflix.js')
  scriptEle.src = src
  scriptEle.onload = () => {
    scriptEle.remove()
  }
  const rootEle = document.head || document.documentElement
  rootEle.appendChild(scriptEle)
}

const DELAY_SEC = 2
setTimeout(() => {
  main()
    .then(() => logger.log('netflix content script loaded'))
    .catch((error) => logger.log('netflix content script load error', error))
}, DELAY_SEC * 1000)
