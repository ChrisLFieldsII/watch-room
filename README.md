# WatchRoom - Watch Together

## How to dev

### Dev Env

- I used nodejs `20.11.1` at time of dev. Any version after `18` should work
- Uses `yarn` as pkg manager

### Extension

- add `.env.dev` and `.env.prod` to root according to `.env.template`
- run `yarn install`
- run `yarn dev` to load the web extension into firefox with hot reloading
- you will need to load an unpacked extension for chrome following [this](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- run `yarn watch` to start the typescript watch process
- you may now code away! thanks to `web-ext`, Firefox will hot reload on code changes, but Chrome will require "Updating" the extension through "Manage extension"

### Server

- cd into `server` dir
- add `.env.dev` and `.env.prod` according to `.env.template`
- run `yarn install`
- run yarn `start:dev`

## Debugging

Follow this link to debug: https://extensionworkshop.com/documentation/develop/debugging/

### Firefox:

- about:debugging
- about:addons

### Chrome:

- chrome://extensions

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
