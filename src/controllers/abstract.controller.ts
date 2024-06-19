export abstract class AbstractController {
  isEnabled: boolean = false

  setEnabled(enabled: boolean): typeof this {
    this.isEnabled = enabled
    return this
  }
}
