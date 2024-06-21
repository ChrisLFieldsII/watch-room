import { logger } from '../utils'
import { VideoPlayer } from './videoPlayer.types'

/**
 * Uses default HTML5 video element
 */
export class DefaultVideoPlayer implements VideoPlayer {
  constructor(private video: HTMLVideoElement) {}

  setVideoTime(time: number): void {
    this.video.currentTime = time
  }

  pause(time: number): void {
    this.video.pause()
    // NOTE: calling seek after play/pause causes a seeked event to be emitted and things can get buggy. just depending on seeked event to sync time for now
    // this.setVideoTime(time)
  }

  play(time: number): void {
    this.video
      .play()
      .then(() => {
        // set video time only works after play is called
        // this.setVideoTime(time)
      })
      .catch((error) => {
        logger.log('video play error', error)
      })
  }
}
