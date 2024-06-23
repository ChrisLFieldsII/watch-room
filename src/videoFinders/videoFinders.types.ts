/**
 * Some sites require a specific way to find the video element.
 */
export interface VideoFinder {
  findVideo(): JQuery<HTMLVideoElement>
}
