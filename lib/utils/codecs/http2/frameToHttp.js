const { decodeRequest } = require('./request')

/**
 * @param {Uint8Array} frame
 * @returns {Http}
 */
function frameToHttp (frame) {
  return decodeRequest(frame)
}

module.exports = frameToHttp
