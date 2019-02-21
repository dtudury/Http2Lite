const { END_STREAM, ACK, END_HEADERS, PADDED, PRIORITY } = require('../../../constants')
const ui8aHelpers = require('../../ui8aHelpers')

/**
 * @typedef {Object} Flags
 * @property {Boolean} endsStream
 * @property {Boolean} isAck
 * @property {Boolean} endsHeaders
 * @property {Boolean} isPadded
 * @property {Boolean} isPriority
 */

/**
 * @typedef {Object} Priority
 * @property {Number} priority
 * @property {Number} streamDependency
 * @property {Boolean} isExclusive
 */

/**
 * @typedef {Object} Http
 * @property {Number} type
 * @property {Flags} flags
 * @property {Number} streamId
 * @property {Uint8Array} payload
 * @property {Priority} priority
 * @property {Number} bytesRead
*/

/**
 * @typedef {Object} FrameHeader
 * @property {Number} streamId
 * @property {Number} type
 * @property {Number} length
 * @property {Flags} flags
*/

/**
 * @private
 * @param {Uint8Array} ui8a
 * @returns {FrameHeader}
 */
function _readFrameHeader (ui8a) {
  const length = ui8aHelpers.readUInt24BE(ui8a, 0)
  const type = ui8aHelpers.readUInt8(ui8a, 3)
  const flags = _byteToFlags(ui8aHelpers.readUInt8(ui8a, 4))
  const streamId = ui8aHelpers.readUInt32BE(ui8a, 5)
  return { streamId, type, length, flags }
}

/**
 * @private
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
function _unpadData (data) {
  const padLength = ui8aHelpers.readUInt8(data, 0)
  return data.slice(1, data.length - padLength)
}

/**
 * @private
 * @param {Uint8Array} priorityBytes
 * @returns {Priority}
 */
function _bytesToPriority (priorityBytes) {
  const word = ui8aHelpers.readUInt32BE(priorityBytes, 0)
  const isExclusive = Boolean(word & 0x80000000)
  const streamDependency = word & 0x7FFFFFFF
  const priority = ui8aHelpers.readUInt8(priorityBytes, 4)
  return { priority, streamDependency, isExclusive }
}

/**
 * @private
 * @param {Number} byte
 * @returns {Flags}
 */
function _byteToFlags (byte) {
  return {
    endsStream: Boolean(byte & END_STREAM),
    isAck: Boolean(byte & ACK),
    endsHeaders: Boolean(byte & END_HEADERS),
    isPadded: Boolean(byte & PADDED),
    isPriority: Boolean(byte & PRIORITY)
  }
}

/**
 * @param {Uint8Array} frame
 * @returns {Http}
 */
function frameToHttp (frame) {
  if (frame.length < 9) { return { bytesRead: 0 } }
  const { streamId, type, length, flags } = _readFrameHeader(frame)
  if (frame.length < 9 + length) { return { bytesRead: 0 } }
  let payload = frame.slice(9, 9 + length)
  if (flags.isPadded) { payload = _unpadData(payload) }
  let priority
  if (flags.isPriority) {
    priority = _bytesToPriority(payload)
    payload = payload.slice(5)
  }
  const bytesRead = 9 + length
  return { type, flags, streamId, payload, priority, bytesRead }
}

module.exports = frameToHttp
