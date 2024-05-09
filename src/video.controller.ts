import $ from 'jquery'
import { AbstractController } from './abstract.controller'

interface VideoEventMap {
  play: {}
  pause: {}
}

type VideoEventKey = keyof VideoEventMap

type VideoEventHandlers = Record<VideoEventKey, () => void>

interface CtorParams {
  eventHandlers: VideoEventHandlers
  enabled: boolean
}

export class VideoController extends AbstractController {
  private video: JQuery<HTMLVideoElement> | null = null

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
      this.video?.off('play.cfiiWatchRoom pause.cfiiWatchRoom')
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

    this.video.on('play.cfiiWatchRoom', () => {
      console.debug('HTML video "play" event', this.getVideoTime())

      if (!this.isEnabled) {
        console.debug('Video is not enabled, ignoring play event')
        return
      }

      eventHandlers.play()
    })

    this.video.on('pause.cfiiWatchRoom', () => {
      console.debug('HTML video "pause" event', this.getVideoTime())

      if (!this.isEnabled) {
        console.debug('Video is not enabled, ignoring pause event')
        return
      }

      eventHandlers.pause()
    })

    return this
  }

  getVideoTime() {
    return this.video?.prop('currentTime') || 0
  }

  setVideoTime(time: number) {
    this.video?.prop('currentTime', time)
  }

  play(time: number) {
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
    this.video?.get(0)?.pause()
    this.setVideoTime(time)
  }

  sync(url: string) {
    window.location.href = url
  }
}
