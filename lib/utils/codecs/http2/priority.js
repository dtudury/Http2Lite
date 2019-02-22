const ui8aHelpers = require('../../ui8aHelpers')
/**
 * @typedef {Object} Priority
 * @property {Number} priority
 * @property {Number} streamDependency
 * @property {Boolean} isExclusive
 */

/**
 * @param {Uint8Array} ui8a
 * @returns {Priority}
 */
function decodePriority (ui8a) {
  const word = ui8aHelpers.readUInt32BE(ui8a, 0)
  const isExclusive = Boolean(word & 0x80000000)
  const streamDependency = word & 0x7FFFFFFF
  const priority = ui8aHelpers.readUInt8(ui8a, 4)
  return { priority, streamDependency, isExclusive }
}

/**
 * @param {Priority} priority
 * @returns {Uint8Array}
 */
function encodePriority (priority) {
  const ui8a = ui8aHelpers.allocUnsafe(5)
  if (priority.isExclusive) { priority.streamDependency += 0x80000000 } // binary OR to set leftmost bit makes value negative
  ui8aHelpers.writeUInt32BE(ui8a, priority.streamDependency)
  ui8aHelpers.writeUInt8(ui8a, priority.priority, 4)
  return ui8a
}

exports.decodePriority = decodePriority
exports.encodePriority = encodePriority
