import { VideoPlayer } from './videoPlayer.types'

interface NetflixVideoPlayerActions {
  seek(time: number): void
}

export class NetflixVideoPlayer implements VideoPlayer {
  constructor() {}

  private getVideoPlayer(): NetflixVideoPlayerActions | null {
    try {
      const videoPlayer =
        // @ts-ignore - netflix not on `window` object
        window.netflix.appContext.state.playerApp.getAPI().videoPlayer
      const player = videoPlayer.getVideoPlayerBySessionId(
        videoPlayer.getAllPlayerSessionIds()[0],
      ) as NetflixVideoPlayerActions
      return player
    } catch (error) {
      console.debug('failed to get netflix video player', error)
      return null
    }
  }

  setVideoTime(time: number): void {
    this.getVideoPlayer()?.seek(time)
  }
}
