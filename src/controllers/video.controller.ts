import $ from 'jquery'
import { AbstractController } from './abstract.controller'
import {
  VideoPlayer,
  DefaultVideoPlayer,
  NetflixVideoPlayer,
} from '../videoPlayers'

/** Custom event map for extension "video" */
interface VideoEventMap {
  play: {}
  pause: {}
  seeked: {}
  playbackRateChanged: {}
}

type VideoEventKey = keyof VideoEventMap

type VideoEventHandlers = Record<VideoEventKey, () => void>

/** Official HTML video events */
type HTMLVideoEventKey = 'play' | 'pause' | 'seeked' | 'ratechange'
const HTML_VIDEO_EVENTS: HTMLVideoEventKey[] = [
  'play',
  'pause',
  'seeked',
  'ratechange',
]

interface CtorParams {
  eventHandlers: VideoEventHandlers
  enabled: boolean
}

export class VideoController extends AbstractController {
  private video: JQuery<HTMLVideoElement> | null = null
  private lastAction: 'play' | 'pause' | null = null
  // private videoPlayer: VideoPlayer  = new DefaultVideoPlayer(null)

  constructor(private params: CtorParams) {
    super()
    const { enabled } = params
    this.setEnabled(enabled)
  }

  setEnabled(enabled: boolean): this {
    super.setEnabled(enabled)
    console.debug('video controller set enabled', enabled)

    if (enabled) {
      this.findVideo()
    } else {
      this.video?.off(HTML_VIDEO_EVENTS.map(generateEventTag).join(' '))
      this.video = null
    }

    return this
  }

  hasVideo() {
    return !!this.video?.length
  }

  findVideo() {
    const { eventHandlers } = this.params

    this.video = $('video')

    if (!this.hasVideo()) {
      console.debug('No video element found')
      return this
    }

    console.debug('Found video element', this.video)

    this.video.on(generateEventTag('play'), () => {
      this.lastAction = 'play'

      console.debug('HTML video "play" event', this.getVideoTime())

      if (!this.isEnabled) {
        console.debug('Video is not enabled, ignoring play event')
        return
      }

      eventHandlers.play()
    })

    this.video.on(generateEventTag('pause'), () => {
      this.lastAction = 'pause'

      console.debug('HTML video "pause" event', this.getVideoTime())

      if (!this.isEnabled) {
        console.debug('Video is not enabled, ignoring pause event')
        return
      }

      eventHandlers.pause()
    })

    this.video.on(generateEventTag('seeked'), () => {
      console.debug('HTML video "seeked" event', this.getVideoTime())

      if (!this.isEnabled) {
        console.debug('Video is not enabled, ignoring seeked event')
        return
      }
      // NOTE: calling play/pause makes seeked event fire since it calls `setVideoTime` so we use `lastAction` to prevent emitting seeked in those cases
      if (this.lastAction !== null) {
        console.debug(
          `Last action was ${this.lastAction} so preventing seeked event`,
        )
        this.lastAction = null
        return
      }

      eventHandlers.seeked()
    })

    this.video.on(generateEventTag('ratechange'), () => {
      console.debug('HTML video "ratechange" event')

      if (!this.isEnabled) {
        console.debug('Video is not enabled, ignoring ratechange event')
        return
      }

      eventHandlers.playbackRateChanged()
    })

    return this
  }

  getVideoTime() {
    return this.video?.prop('currentTime') || 0
  }

  // NOTE: any time this is called, it will also emit a seeked event
  setVideoTime(time: number) {
    this.video?.prop('currentTime', time)
  }

  play(time: number) {
    this.lastAction = 'play'

    this.video
      ?.get(0)
      ?.play()
      .then(() => {
        // set video time only works after play is called
        this.setVideoTime(time)
        console.debug('video play success')
      })
      .catch((error) => console.debug('video play error', error))
  }

  pause(time: number) {
    this.lastAction = 'pause'

    this.video?.get(0)?.pause()
    this.setVideoTime(time)
  }

  sync(url: string) {
    window.location.href = url
  }

  seek(time: number) {
    this.setVideoTime(time)
  }

  getPlaybackRate() {
    return this.video?.get(0)?.playbackRate || 1
  }

  setPlaybackRate(rate: number) {
    const video = this.video?.get(0)
    if (video) video.playbackRate = rate
  }
}

function generateEventTag(event: HTMLVideoEventKey): string {
  return `${event}.cfiiWatchRoom`
}
