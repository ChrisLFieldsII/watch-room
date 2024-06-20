// @ts-nocheck

/* 
  This script is injected into the netflix page so it can access the netflix video player api
*/

console.debug('netflix injected script', window.netflix)

interface NetflixVideoPlayerActions {
  seek(time: number): void
}

function getVideoPlayer(): NetflixVideoPlayerActions | null {
  const videoPlayer =
    window.netflix?.appContext?.state?.playerApp?.getAPI()?.videoPlayer

  if (!videoPlayer) {
    console.debug('failed to get netflix video player')
    return null
  }

  const player = videoPlayer.getVideoPlayerBySessionId(
    videoPlayer.getAllPlayerSessionIds()[0],
  ) as NetflixVideoPlayerActions

  console.debug('got netflix video player', player)
}

window.addEventListener('message', (event) => {
  console.debug('onmessage event', event)
})
