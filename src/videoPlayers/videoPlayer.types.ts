export interface VideoPlayer {
  /** also used for seek */
  setVideoTime(time: number): void
  play(time: number): void
  pause(time: number): void
}
