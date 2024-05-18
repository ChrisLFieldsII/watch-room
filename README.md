# WatchRoom

## How to dev

- run `yarn dev` to load the web extension into firefox with hot reloading
- run `yarn watch` to start the typescript watch process

## Debugging

Follow this link to debug: https://extensionworkshop.com/documentation/develop/debugging/

## Philosophies

- The extension should listen to the video player events rather than re-inventing the wheel and having controls in the extension browserAction
- not doing a chat feature or anything like that. there are plenty other great apps to use for chatting while watching video

## Permissions required and why

- storage: used to store values needed for the extension to work:
  - room id - this is generated via nanoid
  - user id - this is generated via nanoid
  - enabled - determines whether extension is enabled without needing to uninstall. user controlled via popup.
- clipboardWrite: used only for copying the room id to clipboard for easy sharing

## Setting up local https

- Create local CA and cert via [mkcert](https://github.com/FiloSottile/mkcert)
- run `mkcert -install`
- web-ext opens a temp firefox window that will require importing local CA
  - in `about:config`, ensure `security.enterprise_roots.enabled` is `true`
  - in `about:preferences#privacy`, scroll to "Certificates" and click "View Certificates > Authorities > Import". Your local CA should be in `~/Library/Application Support/mkcert`
- may need to reload the extension if api calls to https still fail
