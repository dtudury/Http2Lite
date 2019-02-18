const Emitter = require('./Emitter')
const H2LStream = require('./H2LStream')
const { frameToHttp, httpToFrame } = require('./utils')
const { FRAME, H2LSTREAM } = require('./constants')
const ui8aHelpers = require('./utils/ui8aHelpers')
class H2LSession extends Emitter {
  /**
   * @param {Number} nextStreamId - default is 1 for client, passing 2 would be for server
   */
  constructor (nextStreamId = 1) {
    super([FRAME, H2LSTREAM])
    this.nextStreamId = nextStreamId
    this.frameBuffer = ui8aHelpers.alloc(0) // partial frame holder
    this.h2LStream = new H2LStream(this, 0, this._writeHttp.bind(this))
    this.h2LStreams = [this.h2LStream]
  }
  /**
   * @param {Number} streamId
   * @param {Number} type - frame type from constants
   * @param {Uint8Array} payload
   * @param {Boolean} endsStream
   * @param {Boolean} endsHeaders
   * @param {Number} padLength
   * @param {Number} priority
   * @param {Number} streamDependency
   * @param {Boolean} isExclusive
   */
  _writeHttp (streamId, type, payload, endsStream, endsHeaders, padLength, priority, streamDependency, isExclusive) {
    this.emit(FRAME, httpToFrame(streamId, type, payload, endsStream, endsHeaders, padLength, priority, streamDependency, isExclusive))
  }
  /**
   * Emit any new http messages. Emit new streams when necessary.
   * @param {Uint8Array} frame - partial and/or multiple encoded http messages
   */
  writeFrame (frame) {
    this.frameBuffer = ui8aHelpers.concat([this.frameBuffer, frame])
    const { type, flags, streamId, payload, priority, bytesRead } = frameToHttp(this.frameBuffer)
    if (!bytesRead) {
      return // we don't have one whole frame yet
    }
    if (!this.h2LStreams[streamId]) {
      this.h2LStreams[streamId] = new H2LStream(this, streamId, this._writeHttp.bind(this))
      this.emit(H2LSTREAM, this.h2LStreams[streamId])
    }
    const h2LStream = this.h2LStreams[streamId]
    h2LStream.emit(type, payload, flags, priority)
    this.frameBuffer = this.frameBuffer.slice(bytesRead)
    if (this.frameBuffer.length) {
      this.writeFrame(ui8aHelpers.alloc(0))
    }
  }
  request () {
    const streamId = this.nextStreamId
    this.nextStreamId += 2 // even stays even (server), odd stays odd (client)
    this.h2LStreams[streamId] = new H2LStream(this, streamId, this._writeHttp.bind(this))
    return this.h2LStreams[streamId]
  }
}
module.exports = H2LSession
