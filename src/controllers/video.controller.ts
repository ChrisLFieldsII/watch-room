import $ from 'jquery'

import { AbstractController } from './abstract.controller'
import {
  VideoPlayer,
  DefaultVideoPlayer,
  NetflixVideoPlayer,
} from '../videoPlayers'
import {
  AmazonPrimeVideoFinder,
  DefaultVideoFinder,
  VideoFinder,
} from '../videoFinders'
import { logger } from '../utils'

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
  private videoPlayer: VideoPlayer = new DefaultVideoPlayer(null!) // assigned in findVideo

  constructor(private params: CtorParams) {
    super()
    const { enabled } = params
    this.setEnabled(enabled)
  }

  setEnabled(enabled: boolean): this {
    super.setEnabled(enabled)
    logger.log('video controller set enabled', enabled)

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

    this.video = this.selectVideoFinder().findVideo()

    if (!this.hasVideo()) {
      logger.log('No video element found')
      return this
    }

    this.selectVideoPlayer()

    logger.log('Found video element', this.video)

    this.video.on(generateEventTag('play'), () => {
      logger.log('HTML video "play" event', this.getVideoTime())

      if (!this.isEnabled) {
        logger.log('Video is not enabled, ignoring play event')
        return
      }

      eventHandlers.play()
    })

    this.video.on(generateEventTag('pause'), () => {
      logger.log('HTML video "pause" event', this.getVideoTime())

      if (!this.isEnabled) {
        logger.log('Video is not enabled, ignoring pause event')
        return
      }

      eventHandlers.pause()
    })

    this.video.on(generateEventTag('seeked'), () => {
      logger.log('HTML video "seeked" event', this.getVideoTime())

      if (!this.isEnabled) {
        logger.log('Video is not enabled, ignoring seeked event')
        return
      }

      eventHandlers.seeked()
    })

    this.video.on(generateEventTag('ratechange'), () => {
      logger.log('HTML video "ratechange" event')

      if (!this.isEnabled) {
        logger.log('Video is not enabled, ignoring ratechange event')
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
    this.videoPlayer.setVideoTime(time)
  }

  play(time: number) {
    this.videoPlayer.play(time)
  }

  pause(time: number) {
    this.videoPlayer.pause(time)
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

  private selectVideoPlayer() {
    const url = window.location.href
    if (url.includes('netflix')) {
      logger.log('selecting netflix video player')
      this.videoPlayer = new NetflixVideoPlayer()
    } else {
      logger.log('selecting default HTML5 video player')
      const videoEle = this.video?.get(0)
      if (videoEle) {
        this.videoPlayer = new DefaultVideoPlayer(videoEle)
      }
    }
  }

  private selectVideoFinder(): VideoFinder {
    const url = window.location.href.toLowerCase()
    if (url.includes('amazon') && url.includes('video')) {
      logger.log('selecting amazon video finder')
      return new AmazonPrimeVideoFinder()
    } else {
      logger.log('selecting default video finder')
      return new DefaultVideoFinder()
    }
  }
}

function generateEventTag(event: HTMLVideoEventKey): string {
  return `${event}.cfiiWatchRoom`
}
