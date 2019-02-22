const ui8aHelpers = require('../../ui8aHelpers')
const { decodeFrameHeader, encodeFrameHeader } = require('./frameHeader')
const { decodePriority, encodePriority } = require('./priority')

/**
 * @typedef {Object} Request
 * @property {Number} type
 * @property {import('./flags').Flags} flags
 * @property {Number} streamId
 * @property {Number} padLength
 * @property {Uint8Array} payload
 * @property {import('./priority').Priority} priority
 * @property {Number} bytesRead
*/

/**
 * @private
 * @param {Uint8Array} data
 * @param {Number} padLength
 * @returns {Uint8Array}
 */
function _unpadData (data, padLength) {
  return data.slice(1, data.length - padLength)
}

/**
 * @private
 * @param {Uint8Array} data
 * @param {Number} padLength
 * @returns {Uint8Array}
 */
function _padData (data, padLength) {
  const lengthByte = ui8aHelpers.allocUnsafe(1)
  ui8aHelpers.writeUInt8(lengthByte, padLength, 0)
  return ui8aHelpers.concat([lengthByte, data, ui8aHelpers.alloc(padLength)], data.length + padLength + 1)
}

/**
 * @param {Uint8Array} ui8a
 * @returns {Request}
 */
function decodeRequest (ui8a) {
  if (ui8a.length < 9) { return { bytesRead: 0 } }
  const { streamId, type, length, flags } = decodeFrameHeader(ui8a)
  if (ui8a.length < 9 + length) { return { bytesRead: 0 } }
  let payload = ui8a.slice(9, 9 + length)
  let padLength = 0
  if (flags.isPadded) {
    padLength = ui8aHelpers.readUInt8(payload, 0)
    payload = _unpadData(payload, padLength)
  }
  let priority
  if (flags.isPriority) {
    priority = decodePriority(payload)
    payload = payload.slice(5)
  }
  const bytesRead = 9 + length
  return { type, flags, streamId, padLength, payload, priority, bytesRead }
}

/**
 * @param {Request} request
 * @returns {Uint8Array}
 */
function encodeRequest (request) {
  let payload = request.payload
  if (request.priority && (request.priority.priority || request.priority.streamDependency)) {
    payload = ui8aHelpers.concat([encodePriority(request.priority), payload])
  }
  if (request.padLength) {
    payload = _padData(payload, request.padLength)
  }
  let encodedFrameHeader = encodeFrameHeader({
    streamId: request.streamId,
    type: request.type,
    length: payload.length,
    flags: request.flags
  })
  return ui8aHelpers.concat([encodedFrameHeader, payload])
}

exports.decodeRequest = decodeRequest
exports.encodeRequest = encodeRequest
