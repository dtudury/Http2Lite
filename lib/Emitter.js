module.exports = class Emitter {
  constructor (eventNames) {
    this.events = {}
    eventNames.forEach(eventName => {
      this.events[eventName] = new Set()
    })
  }
  on (event, callback) {
    this.events[event].add(callback)
  }
  off (event, callback) {
    this.events[event].delete(callback)
  }
  emit (event, ...args) {
    this.events[event].forEach(callback => callback.apply(null, args))
  }
}
