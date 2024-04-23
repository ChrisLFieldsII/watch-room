# Media Sync

## How to dev

- run `yarn dev` to load the web extension into firefox with hot reloading
- run `yarn watch` to start the typescript watch process

## Debugging

Follow this link to debug: https://extensionworkshop.com/documentation/develop/debugging/

## Philosophies

- The extension should listen to the video player events rather than re-inventing the wheel and having controls in the extension browserAction

## TODOS

- technically disabling should tear down the socket
- so if have 2 tabs with youtube and use extension, the other tab will start playing video. should only work on active tab
