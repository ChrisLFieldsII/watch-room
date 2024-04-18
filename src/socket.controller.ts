import { io, Socket } from 'socket.io-client'

interface EventMap {
  playVideo: { time: number }
}

type EventKey = keyof EventMap

/** use this to type the event handler function data */
export type EventData<T extends EventKey> = EventMap[T] & { userId: string }

/**
 * `data` is unfortunately typed as `any` because the event handlers can have different data types & couldn't figure a good way to type this off the `EventKey`
 * type the `data` for each handler with the `EventData` generic type instead.
 */
type EventHandlers = Record<EventKey, (data: any) => void>

/** interface for socket emit/on functions: https://socket.io/docs/v4/typescript/#types-for-the-client */
interface SocketEvents {
  events: <T extends EventKey>(event: {
    type: T
    data: EventMap[T] & { userId: string }
  }) => void
}

interface InitParams {
  uri: string
  userId: string
  eventHandlers: EventHandlers
}

export class SocketController {
  // @ts-expect-error - we know init will be called
  private socket: Socket<SocketEvents>
  private userId: string = ''

  /**
   * Creates the socket connection and sets up event listeners
   */
  init = ({ uri, eventHandlers, userId }: InitParams) => {
    console.debug('initializing socket controller', { uri, userId })

    this.userId = userId

    this.socket = io(uri, {
      transports: ['websocket'],
    })

    this.socket
      .on('connect', () => {
        console.debug(`Connected to socket with id ${this.socket.id}`)

        this.socket.on('events', (event) => {
          console.debug('received event', event)
          const { type, data } = event

          if (data.userId === userId) {
            console.debug('received event from self, ignoring...')
            return
          }

          const handler = eventHandlers[type]
          if (handler) {
            handler(data)
          } else {
            console.debug(`No handler for event type ${type}`)
          }
        })
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
          window.alert(
            `Failed to establish socket connection to server: ${error.message}`,
          )
        }
      })

    return this
  }

  emit = <T extends EventKey>(type: T, data: EventMap[T]) => {
    console.debug('emitting event', type, data)
    this.socket.emit('events', { type, data: { ...data, userId: this.userId } })
    return this
  }
}
