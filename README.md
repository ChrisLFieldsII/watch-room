# Media Sync

## How to dev

- run `yarn dev` to load the web extension into firefox with hot reloading
- run `yarn watch` to start the typescript watch process

## Debugging

Follow this link to debug: https://extensionworkshop.com/documentation/develop/debugging/

## Philosophies

- The extension should listen to the video player events rather than re-inventing the wheel and having controls in the extension browserAction

## TODOS

- find video button is buggy. if go to tab with video and its found, then switch to tab without video, then switch back to tab with video, it says the video is not found even though it is. clicking the btn then doubles up the video events.
- technically disabling should tear down the socket
- so if have 2 tabs with youtube and use extension, the other tab will start playing video. should only work on active tab
