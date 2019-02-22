const ui8aHelpers = require('../../ui8aHelpers')
const { decodeFlags, encodeFlags } = require('./flags')

/**
 * @typedef {Object} FrameHeader
 * @property {Number} streamId
 * @property {Number} type
 * @property {Number} length
 * @property {import('./flags').Flags} flags
*/

/**
 * @param {Uint8Array} ui8a
 * @returns {FrameHeader}
 */
function decodeFrameHeader (ui8a) {
  const length = ui8aHelpers.readUInt24BE(ui8a, 0)
  const type = ui8aHelpers.readUInt8(ui8a, 3)
  const flags = decodeFlags(ui8aHelpers.readUInt8(ui8a, 4))
  const streamId = ui8aHelpers.readUInt32BE(ui8a, 5)
  return { streamId, type, length, flags }
}

/**
 * @param {FrameHeader} frameHeader
 * @returns {Uint8Array}
 */
function encodeFrameHeader (frameHeader) {
  const ui8a = ui8aHelpers.allocUnsafe(9)
  if (frameHeader.length > 0xFFFFFF) {
    throw new Error(`length is too big for frame: ${frameHeader.length}`)
  }
  ui8aHelpers.writeUInt24BE(ui8a, frameHeader.length, 0)
  ui8aHelpers.writeUInt8(ui8a, frameHeader.type, 3)
  ui8aHelpers.writeUInt8(ui8a, encodeFlags(frameHeader.flags), 4)
  ui8aHelpers.writeUInt32BE(ui8a, frameHeader.streamId, 5)
  return ui8a
}

exports.decodeFrameHeader = decodeFrameHeader
exports.encodeFrameHeader = encodeFrameHeader
