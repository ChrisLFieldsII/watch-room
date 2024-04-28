# Media Sync

## How to dev

- run `yarn dev` to load the web extension into firefox with hot reloading
- run `yarn watch` to start the typescript watch process

## Debugging

Follow this link to debug: https://extensionworkshop.com/documentation/develop/debugging/

## Philosophies

- The extension should listen to the video player events rather than re-inventing the wheel and having controls in the extension browserAction

## Permissions required and why

- storage: used to store values needed for the extension to work:
  - room id - this is generated via nanoid
  - user id - this is generated via nanoid
  - enabled - determines whether extension is enabled without needing to uninstall. user controlled via popup.
- clipboardWrite: used only for copying the room id to clipboard for easy sharing

## TODOS

- make action look pretty
- add donation page
- messaging system isnt really typed well at the moment
- make svg icon
- add whether socket is connected to popup
