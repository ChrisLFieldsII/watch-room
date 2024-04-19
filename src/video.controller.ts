import $ from 'jquery'

interface VideoEventMap {
  play: {}
  pause: {}
  ended: {}
  seeked: {}
}

type VideoEventKey = keyof VideoEventMap

type VideoEventHandlers = Record<VideoEventKey, () => void>

interface InitParams {
  eventHandlers: VideoEventHandlers
}

export class VideoController {
  private video: JQuery<HTMLVideoElement> | null = null

  findVideo() {
    this.video = $('video')
    return this
  }

  init({ eventHandlers }: InitParams) {
    this.findVideo()

    if (!this.video?.length) {
      console.debug('No video element found')
      return this
    }

    this.video.on('play', () => {
      console.debug('HTML video "play" event', this.getVideoTime())

      eventHandlers.play()
    })

    this.video.on('pause', () => {
      console.debug('HTML video "pause" event', this.getVideoTime())

      eventHandlers.pause()
    })

    this.video.on('ended', () => {
      console.debug('HTML video "ended" event', this.getVideoTime())

      eventHandlers.ended()
    })

    this.video.on('seeked', () => {
      console.debug('HTML video "seeked" event', this.getVideoTime())

      eventHandlers.seeked()
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
      .catch((error) => console.error('video play error', error))
  }

  pause(time: number) {
    this.video?.get(0)?.pause()
    this.setVideoTime(time)
  }
}
