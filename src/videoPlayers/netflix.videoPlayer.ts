import { VideoPlayer } from './videoPlayer.types'

interface NetflixVideoPlayerActions {
  seek(time: number): void
}

// NOTE: might rename this to noop.videoPlayer.ts
export class NetflixVideoPlayer implements VideoPlayer {
  setVideoTime(time: number): void {
    // noop. handled by netflix.ts injected script
  }

  pause(time: number): void {
    // noop. handled by netflix.ts injected script
  }

  play(time: number): void {
    // noop. handled by netflix.ts injected script
  }
}
