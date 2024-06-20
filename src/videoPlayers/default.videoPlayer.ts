import { VideoPlayer } from './videoPlayer.types'

/**
 * Uses default HTML5 video element
 */
export class DefaultVideoPlayer implements VideoPlayer {
  constructor(private video: HTMLVideoElement) {}

  setVideoTime(time: number): void {
    this.video.currentTime = time
  }
}
