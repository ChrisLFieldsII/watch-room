import { VideoFinder } from './videoFinders.types'
import $ from 'jquery'

export class DefaultVideoFinder implements VideoFinder {
  findVideo(): JQuery<HTMLVideoElement> {
    return $('video')
  }
}
