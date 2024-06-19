import { io, Socket } from 'socket.io-client'
import { AbstractController } from './abstract.controller'
import { isDocumentVisible } from './utils'

interface SocketEventMap {
  playVideo: { time: number }
  pauseVideo: { time: number }
  seekedVideo: { time: number }
  sync: { url: string }
  heartbeat: {}
}

export type SocketEventKey = keyof SocketEventMap

/** use this to type the event handler function data */
export type SocketEventData<T extends SocketEventKey> = SocketEventMap[T] & {
  userId: string
  roomId: string
}
export type RawSocketEventData<T extends SocketEventKey> = SocketEventMap[T]

/**
 * `data` is unfortunately typed as `any` because the event handlers can have different data types & couldn't figure a good way to type this off the `EventKey`
 * type the `data` for each handler with the `EventData` generic type instead.
 */
type SocketEventHandlers = Record<SocketEventKey, (data: any) => void>

/** interface for socket emit/on functions: https://socket.io/docs/v4/typescript/#types-for-the-client */
interface SocketEvents {
  events: <T extends SocketEventKey>(event: {
    type: T
    data: SocketEventMap[T] & { userId: string; roomId: string }
  }) => void
}

interface CtorParams {
  uri: string
  eventHandlers: SocketEventHandlers
  transports?: string[]
}

export class SocketController extends AbstractController {
  private socket: Socket<SocketEvents>
  /** the room id can change and should be pulled from here and not the ctor params */
  private roomId: string = ''
  private userId: string = ''
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor(private params: CtorParams) {
    super()
    const { uri, eventHandlers } = params

    this.socket = io(uri, {
      transports: params.transports,
      autoConnect: false,
      reconnectionAttempts: 5,
    })

    this.socket
      .on('connect', () => {
        console.debug(`Connected to socket with id ${this.socket.id}`)
      })
      .on('connect_error', (error) => {
        if (this.socket.active) {
          // temporary failure, the socket will automatically try to reconnect
          console.debug(
            'temporary socket connection error. socket is reconnecting...',
          )
        } else {
          // the connection was denied by the server
          // in that case, `socket.connect()` must be manually called in order to reconnect
          console.debug(
            `Failed to establish socket connection to server: ${error.message}`,
          )
        }
      })
      .on('disconnect', (reason) => {
        console.debug('socket disconnected', reason)
      })
      .on('events', (event) => {
        console.debug('socket received event', event)
        const { type, data } = event

        if (data.userId === this.userId) {
          console.debug('received event from self, ignoring...')
          return
        }
        if (data.roomId !== this.roomId) {
          console.debug('received event from different room, ignoring...')
          return
        }
        if (!this.isEnabled) {
          console.debug('socket is not enabled, ignoring event')
          return
        }

        const handler = eventHandlers[type]
        if (handler) {
          handler(data)
        } else {
          console.debug(`No handler for event type ${type}`)
        }
      })
  }

  setEnabled(enabled: boolean): this {
    super.setEnabled(enabled)
    console.debug('socket controller set enabled', enabled)
    if (enabled) {
      this.connect()
    } else {
      this.disconnect()
    }
    return this
  }

  /**
   * Creates the socket connection and sets up event listeners
   */
  connect = () => {
    console.debug('connecting to socket...')
    this.socket.connect()
    return this
  }

  disconnect = () => {
    console.debug('disconnecting from socket...')
    this.socket.disconnect()
    return this
  }

  emit = <T extends SocketEventKey>(
    type: T,
    data: SocketEventMap[T],
    skip = false,
  ) => {
    if (!skip) {
      console.debug('emitting event', type, data)
      this.socket.emit('events', {
        type,
        data: { ...data, userId: this.userId, roomId: this.roomId },
      })
    }
    return this
  }

  setRoomId = (roomId: string) => {
    this.roomId = roomId
    return this
  }

  setUserId = (userId: string) => {
    this.userId = userId
    return this
  }

  isConnected() {
    return this.socket.connected
  }

  /**
   * helps keep service worker alive so it doesnt kill websocket
   * https://github.com/GoogleChrome/chrome-extensions-samples/blob/main/functional-samples/tutorial.websockets/service-worker.js
   * https://developer.chrome.com/docs/extensions/how-to/web-platform/websockets
   * TODO: decide whether to use this or not
   */
  startHeartbeat() {
    if (this.heartbeatInterval) {
      console.debug('heartbeat already started')
      return
    }

    this.heartbeatInterval = setInterval(
      () => {
        if (!this.isConnected()) {
          console.debug('socket is not connected, skipping heartbeat')
          return
        }

        this.emit('heartbeat', { time: Date.now() }, true)
      },
      // heartbeat every 20 seconds to keep service worker alive since it dies after 30 seconds of inactivity
      1000 * 20,
    )
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}
