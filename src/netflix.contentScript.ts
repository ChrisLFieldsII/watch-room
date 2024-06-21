import browser from 'webextension-polyfill'

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
    .then(() => console.debug('netflix content script loaded'))
    .catch((error) => console.debug('netflix content script load error', error))
}, DELAY_SEC * 1000)
