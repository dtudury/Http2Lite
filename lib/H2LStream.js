const { Buffer } = require('buffer')
const Emitter = require('./Emitter')
const { DATA, HEADERS, PING } = require('./constants')
module.exports = class H2LStream extends Emitter {
  constructor (h2LSession, streamId, writeHttp) {
    super([DATA, HEADERS, PING])
    this.writeHttp = writeHttp
    this.h2LSession = h2LSession
    this.streamId = streamId
  }
  writeData (payload, endsStream = false, padLength = 0) {
    this.writeHttp(this.streamId, DATA, payload, endsStream, null, padLength)
  }
  writeHeaders (headers, endsStream = false, endsHeaders = false, padLength = 0, priority = 0, streamDependency = 0, isExclusive = false) {
    let payload = Buffer.from(JSON.stringify(headers), 'utf8')
    this.writeHttp(this.streamId, HEADERS, payload, endsStream, endsHeaders, padLength, priority, streamDependency, isExclusive)
  }
  writePing (payload, isAck = false) {
    this.writeHttp(0, PING, payload, isAck)
  }
}
