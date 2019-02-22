const Emitter = require('./utils/Emitter')
const { DATA, HEADERS, PING } = require('./constants')
const { encodeRequest, decodeRequest } = require('./utils/codecs')
const { FRAME, H2LSTREAM } = require('./constants')
const ui8aHelpers = require('./utils/ui8aHelpers')

/**
 * Muxes and demuxes
 */
class H2LSession extends Emitter {
  /**
   * @param {Number} nextStreamId - default is 1 for client, passing 2 would be for server
   */
  constructor (nextStreamId = 1) {
    super([FRAME, H2LSTREAM])
    this.nextStreamId = nextStreamId
    this.frameBuffer = ui8aHelpers.alloc(0) // partial frame holder
    this.h2LStream = new H2LStream(this, 0)
    this.h2LStreams = [this.h2LStream]
  }

  /**
   * Emit any new http messages. Emit new streams when necessary.
   * @param {Uint8Array} frame - partial and/or multiple encoded http messages
   */
  writeFrame (frame) {
    this.frameBuffer = ui8aHelpers.concat([this.frameBuffer, frame])
    const request = decodeRequest(this.frameBuffer)
    // const { type, flags, streamId, payload, priority, bytesRead } = frameToHttp(this.frameBuffer)
    if (!request.bytesRead) {
      return // we don't have one whole frame yet
    }
    if (!this.h2LStreams[request.streamId]) {
      this.h2LStreams[request.streamId] = new H2LStream(this, request.streamId)
      this.emit(H2LSTREAM, this.h2LStreams[request.streamId])
    }
    const h2LStream = this.h2LStreams[request.streamId]
    h2LStream.emit(request.type, request)
    this.frameBuffer = this.frameBuffer.slice(request.bytesRead)
    if (this.frameBuffer.length) {
      this.writeFrame(ui8aHelpers.alloc(0))
    }
  }

  /**
   * @returns {H2LStream}
   */
  request () {
    const streamId = this.nextStreamId
    this.nextStreamId += 2 // even stays even (server), odd stays odd (client)
    this.h2LStreams[streamId] = new H2LStream(this, streamId)
    return this.h2LStreams[streamId]
  }
}

/**
 * Gateway for reading from and writing to virtual streams
 */
class H2LStream extends Emitter {
  /**
   * Create a gateway for reading from and writing to a virtual stream
   * @param {H2LSession} h2LSession
   * @param {Number} streamId
   */
  constructor (h2LSession, streamId) {
    super([DATA, HEADERS, PING])
    this.h2LSession = h2LSession
    this.streamId = streamId
  }

  /**
   * Encode http-like request and mux it into the output stream
   * @param {import('./utils/codecs/http2/request').Request} request
   */
  writeRequest (request) {
    request.streamId = this.streamId
    this.h2LSession.emit(FRAME, encodeRequest(request))
  }
}

module.exports = H2LSession
