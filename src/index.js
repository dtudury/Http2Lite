const { Buffer } = require('buffer')
const Emitter = require('../Emitter')
const VStream = require('./VStream')
const { frameToHttp, httpToFrame } = require('./utils')
const { FRAME, VSTREAM } = require('./constants')
class Http2Lite extends Emitter {
  constructor (nextStreamId = 1) { // default client, 2 for server
    super([FRAME, VSTREAM])
    this.nextStreamId = nextStreamId
    this.frameBuffer = Buffer.alloc(0)
    this.vStream = new VStream(this, 0)
    this._vStreams = [this.vStream]
  }
  writeFrame (frame) {
    this.frameBuffer = Buffer.concat([this.frameBuffer, frame])
    const { type, flags, streamId, payload, priority, bytesRead } = frameToHttp(this.frameBuffer)
    if (!bytesRead) {
      return
    }
    if (!this._vStreams[streamId]) {
      this._vStreams[streamId] = new VStream(this, streamId)
      this.emit(VSTREAM, this._vStreams[streamId])
    }
    const vStream = this._vStreams[streamId]
    vStream.emit(type, payload, flags, priority)
    this.frameBuffer = this.frameBuffer.slice(bytesRead)
    if (this.frameBuffer.length) {
      this.writeFrame(Buffer.alloc(0))
    }
  }
  writeHttp (streamId, type, payload, endsStream, endsHeaders, padLength, priority, streamDependency, isExclusive) {
    this.emit(FRAME, httpToFrame(streamId, type, payload, endsStream, endsHeaders, padLength, priority, streamDependency, isExclusive))
  }
  createVirtualStream () {
    const streamId = this.nextStreamId
    this.nextStreamId += 2 // even stays even, odd stays odd
    this._vStreams[streamId] = new VStream(this, streamId)
    return this._vStreams[streamId]
  }
}
module.exports = Http2Lite
