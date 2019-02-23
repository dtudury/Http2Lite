const { END_STREAM, ACK, END_HEADERS, PADDED, PRIORITY } = require('../../../constants')

/**
 * @typedef {Object} Flags
 * @property {Boolean} endStream
 * @property {Boolean} isAck
 * @property {Boolean} endHeaders
 * @property {Boolean} isPadded
 * @property {Boolean} isPriority
 */

/**
 * @param {Number} ui8
 * @returns {Flags}
 */
function decodeFlags (ui8) {
  return {
    endStream: Boolean(ui8 & END_STREAM),
    isAck: Boolean(ui8 & ACK),
    endHeaders: Boolean(ui8 & END_HEADERS),
    isPadded: Boolean(ui8 & PADDED),
    isPriority: Boolean(ui8 & PRIORITY)
  }
}

function encodeFlags (flags) {
  if (!flags) {
    return 0
  }
  let ui8 = 0
  if (flags.endStream) { ui8 |= END_STREAM }
  if (flags.isAck) { ui8 |= ACK }
  if (flags.endHeaders) { ui8 |= END_HEADERS }
  if (flags.isPadded) { ui8 |= PADDED }
  if (flags.isPriority) { ui8 |= PRIORITY }
  return ui8
}

exports.decodeFlags = decodeFlags
exports.encodeFlags = encodeFlags
