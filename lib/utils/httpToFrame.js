const { END_STREAM, END_HEADERS, PADDED, PRIORITY } = require('../constants')
const { Buffer } = require('buffer')
function _flagsToByte (endStreamOrIsAck, endsHeaders, isPadded, isPriority) {
  let byte = 0
  if (endStreamOrIsAck) { byte |= END_STREAM } // same bit
  if (endsHeaders) { byte |= END_HEADERS }
  if (isPadded) { byte |= PADDED }
  if (isPriority) { byte |= PRIORITY }
  return byte
}
function _priorityToBytes (priority, streamDependency, isExclusive) {
  const priorityBytes = Buffer.allocUnsafe(5)
  if (isExclusive) { streamDependency += 0x80000000 } // binary OR to set leftmost bit makes value negative
  priorityBytes.writeUInt32BE(streamDependency)
  priorityBytes.writeUInt8(priority, 4)
  return priorityBytes
}
function _padData (data, padLength) {
  const lengthByte = Buffer.allocUnsafe(1)
  lengthByte.writeUInt8(padLength)
  return Buffer.concat([lengthByte, data, Buffer.alloc(padLength)], data.length + padLength + 1)
}
function _createFrameHeader (streamId, type, length, flags) {
  const buffer = Buffer.allocUnsafe(9)
  if (length > 0xFFFFFF) {
    throw new Error(`length is too big for frame: ${length}`)
  }
  buffer.writeUInt32BE((length & 0xFFFFFF) << 8) // sadly there's no writeUInt24BE...
  buffer.writeUInt8(type, 3)
  buffer.writeUInt8(flags, 4)
  buffer.writeUInt32BE(streamId, 5)
  return buffer
}
function httpToFrame (streamId, type, payload, endStreamOrIsAck, endsHeaders, padLength, priority, streamDependency, isExclusive) {
  const flags = _flagsToByte(endStreamOrIsAck, endsHeaders, padLength, priority)
  if (priority) {
    payload = Buffer.concat([_priorityToBytes(priority, streamDependency, isExclusive), payload])
  }
  if (padLength) {
    payload = _padData(payload, padLength)
  }
  return Buffer.concat([_createFrameHeader(streamId, type, payload.length, flags), payload], payload.length + 9)
}
module.exports = httpToFrame
