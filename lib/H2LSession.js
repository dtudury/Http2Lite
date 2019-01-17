const { Buffer } = require('buffer')
const Emitter = require('./Emitter')
const H2LStream = require('./H2LStream')
const { frameToHttp, httpToFrame } = require('./utils')
const { FRAME, H2LSTREAM } = require('./constants')
class H2LSession extends Emitter {
  constructor (nextStreamId = 1) { // default client, 2 for server
    super([FRAME, H2LSTREAM])
    this.nextStreamId = nextStreamId
    this.frameBuffer = Buffer.alloc(0)
    this.h2LStream = new H2LStream(this, 0, this._writeHttp.bind(this))
    this.h2LStreams = [this.h2LStream]
  }
  _writeHttp (streamId, type, payload, endsStream, endsHeaders, padLength, priority, streamDependency, isExclusive) {
    this.emit(FRAME, httpToFrame(streamId, type, payload, endsStream, endsHeaders, padLength, priority, streamDependency, isExclusive))
  }
  writeFrame (frame) {
    this.frameBuffer = Buffer.concat([this.frameBuffer, frame])
    const { type, flags, streamId, payload, priority, bytesRead } = frameToHttp(this.frameBuffer)
    if (!bytesRead) {
      return
    }
    if (!this.h2LStreams[streamId]) {
      this.h2LStreams[streamId] = new H2LStream(this, streamId, this._writeHttp.bind(this))
      this.emit(H2LSTREAM, this.h2LStreams[streamId])
    }
    const h2LStream = this.h2LStreams[streamId]
    h2LStream.emit(type, payload, flags, priority)
    this.frameBuffer = this.frameBuffer.slice(bytesRead)
    if (this.frameBuffer.length) {
      this.writeFrame(Buffer.alloc(0))
    }
  }
  createVirtualStream () {
    const streamId = this.nextStreamId
    this.nextStreamId += 2 // even stays even, odd stays odd
    this.h2LStreams[streamId] = new H2LStream(this, streamId, this._writeHttp.bind(this))
    return this.h2LStreams[streamId]
  }
}
module.exports = H2LSession
