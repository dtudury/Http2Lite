const { Buffer } = require('buffer')
const Emitter = require('../Emitter')
const {DATA, HEADERS, PING} = require('./constants')
module.exports = class VStream extends Emitter {
  constructor (http2Lite, streamId) {
    super([DATA, HEADERS, PING])
    this.http2Lite = http2Lite
    this.streamId = streamId
  }
  writeData (payload, endsStream = false, padLength = 0) {
    this.http2Lite.writeHttp(this.streamId, DATA, payload, endsStream, null, padLength)
  }
  writeHeaders (headers, endsStream = false, endsHeaders = false, padLength = 0, priority = 0, streamDependency = 0, isExclusive = false) {
    let payload = Buffer.from(JSON.stringify(headers), 'utf8')
    this.http2Lite.writeHttp(this.streamId, HEADERS, payload, endsStream, endsHeaders, padLength, priority, streamDependency, isExclusive)
  }
  writePing (payload, isAck = false) {
    this.http2Lite.writeHttp(0, PING, payload, isAck)
  }
}
