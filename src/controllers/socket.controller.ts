import { io, Socket } from 'socket.io-client'
import { AbstractController } from './abstract.controller'
import { isDocumentVisible, logger } from '../utils'

interface SocketEventMap {
  playVideo: { time: number }
  pauseVideo: { time: number }
  seekedVideo: { time: number }
  sync: { url: string }
  playbackRateChanged: { playbackRate: number }
  heartbeat: {}
  joinRoom: { roomId: string }
  leaveRoom: { roomId: string }
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
        logger.log(`Connected to socket with id ${this.socket.id}`)
      })
      .on('connect_error', (error) => {
        if (this.socket.active) {
          // temporary failure, the socket will automatically try to reconnect
          logger.log(
            'temporary socket connection error. socket is reconnecting...',
          )
        } else {
          // the connection was denied by the server
          // in that case, `socket.connect()` must be manually called in order to reconnect
          logger.log(
            `Failed to establish socket connection to server: ${error.message}`,
          )
        }
      })
      .on('disconnect', (reason) => {
        logger.log('socket disconnected', reason)
      })
      .on('events', (event) => {
        const { type, data } = event

        if (data.userId === this.userId) {
          logger.log('received event from self, ignoring...')
          return
        }
        if (data.roomId !== this.roomId) {
          logger.log('received event from different room, ignoring...')
          return
        }
        if (!this.isEnabled) {
          logger.log('socket is not enabled, ignoring event')
          return
        }

        logger.log('socket received event', JSON.stringify(event, null, 2))

        const handler = eventHandlers[type]
        if (handler) {
          handler(data)
        } else {
          logger.log(`No handler for event type ${type}`)
        }
      })
  }

  setEnabled(enabled: boolean): this {
    super.setEnabled(enabled)
    logger.log('socket controller set enabled', enabled)
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
    logger.log('connecting to socket...')
    this.socket.connect()
    this.emitJoinRoom()
    return this
  }

  disconnect = () => {
    logger.log('disconnecting from socket...')
    this.socket.disconnect()
    return this
  }

  emit = <T extends SocketEventKey>(
    type: T,
    data: SocketEventMap[T],
    skip = false,
  ) => {
    if (!skip) {
      logger.log('emitting event', type, data)
      this.socket.emit('events', {
        type,
        data: { ...data, userId: this.userId, roomId: this.roomId },
      })
    }
    return this
  }

  setRoomId = (roomId: string) => {
    this.roomId = roomId
    this.emitJoinRoom()
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
      logger.log('heartbeat already started')
      return
    }

    this.heartbeatInterval = setInterval(
      () => {
        if (!this.isConnected()) {
          logger.log('socket is not connected, skipping heartbeat')
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

  /**
   * joining a room will leave the current room and join the new room on the server side.
   * disconnecting will automatically leave all rooms
   */
  private emitJoinRoom = () => {
    this.emit('joinRoom', { roomId: this.roomId })
  }
}
