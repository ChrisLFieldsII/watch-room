import { VideoFinder } from './videoFinders.types'
import $ from 'jquery'

export class AmazonPrimeVideoFinder implements VideoFinder {
  // prime renders multiple videos (ads) so we require a more specific selector
  findVideo(): JQuery<HTMLVideoElement> {
    return $('#dv-web-player video')
  }
}
