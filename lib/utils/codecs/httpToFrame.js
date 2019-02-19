const { END_STREAM, END_HEADERS, PADDED, PRIORITY } = require('../../constants')
const ui8aHelpers = require('../ui8aHelpers')
function _flagsToByte (endStreamOrIsAck, endsHeaders, isPadded, isPriority) {
  let byte = 0
  if (endStreamOrIsAck) { byte |= END_STREAM } // same bit
  if (endsHeaders) { byte |= END_HEADERS }
  if (isPadded) { byte |= PADDED }
  if (isPriority) { byte |= PRIORITY }
  return byte
}
function _priorityToBytes (priority, streamDependency, isExclusive) {
  const priorityBytes = ui8aHelpers.allocUnsafe(5)
  if (isExclusive) { streamDependency += 0x80000000 } // binary OR to set leftmost bit makes value negative
  ui8aHelpers.writeUInt32BE(priorityBytes, streamDependency)
  ui8aHelpers.writeUInt8(priorityBytes, priority, 4)
  return priorityBytes
}
function _padData (data, padLength) {
  const lengthByte = ui8aHelpers.allocUnsafe(1)
  ui8aHelpers.writeUInt8(lengthByte, padLength, 0)
  return ui8aHelpers.concat([lengthByte, data, ui8aHelpers.alloc(padLength)], data.length + padLength + 1)
}
function _createFrameHeader (streamId, type, length, flags) {
  const ui8a = ui8aHelpers.allocUnsafe(9)
  if (length > 0xFFFFFF) {
    throw new Error(`length is too big for frame: ${length}`)
  }
  ui8aHelpers.writeUInt24BE(ui8a, length, 0)
  ui8aHelpers.writeUInt8(ui8a, type, 3)
  ui8aHelpers.writeUInt8(ui8a, flags, 4)
  ui8aHelpers.writeUInt32BE(ui8a, streamId, 5)
  return ui8a
}
function httpToFrame (streamId, type, payload, endStreamOrIsAck, endsHeaders, padLength, priority, streamDependency, isExclusive) {
  const flags = _flagsToByte(endStreamOrIsAck, endsHeaders, padLength, priority)
  if (priority) {
    payload = ui8aHelpers.concat([_priorityToBytes(priority, streamDependency, isExclusive), payload])
  }
  if (padLength) {
    payload = _padData(payload, padLength)
  }
  return ui8aHelpers.concat([_createFrameHeader(streamId, type, payload.length, flags), payload], payload.length + 9)
}
module.exports = httpToFrame
