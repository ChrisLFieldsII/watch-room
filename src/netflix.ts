/* 
  This script is injected into the netflix page so it can access the netflix video player api
*/

interface NetflixVideoPlayerActions {
  seek(time: number): void
  pause(): void
  play(): void
}

function getNetflixPlayer(): NetflixVideoPlayerActions | null {
  const videoPlayer =
    // @ts-ignore
    window.netflix?.appContext?.state?.playerApp?.getAPI()?.videoPlayer

  if (!videoPlayer) {
    console.debug('failed to get netflix video player')
    return null
  }

  const player = videoPlayer.getVideoPlayerBySessionId(
    videoPlayer.getAllPlayerSessionIds()[0],
  ) as NetflixVideoPlayerActions

  // console.debug('got netflix video player', player)

  return player
}

window.addEventListener('message', async (event) => {
  const {
    data,
    type = '',
    svc = '',
  } = (event.data || {}) as { type?: string; data?: any; svc?: string }
  if (svc !== 'cfiiWatchRoom') {
    return
  }

  const netflixPlayer = getNetflixPlayer()

  if (type === 'play') {
    await netflixPlayer?.play()
    // NOTE: calling seek after play/pause seems to sometimes cause an infinite loop. use seek alone to sync time
    // netflixPlayer?.seek(data.time * 1000)
  }
  if (type === 'pause') {
    await netflixPlayer?.pause()
    // netflixPlayer?.seek(data.time * 1000)
  }
  if (type === 'seeked') {
    await netflixPlayer?.seek(data.time * 1000)
  }
})
