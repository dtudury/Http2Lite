const { HEADERS, END_STREAM, ACK, END_HEADERS, PADDED, PRIORITY } = require('../constants')
function _readFrameHeader (buffer) {
  const length = (buffer.readUInt32BE(0) & 0xFFFFFF) >>> 8 // sadly there's no readUInt24BE...
  const type = buffer.readUInt8(3)
  const flags = _byteToFlags(buffer.readUInt8(4))
  const streamId = buffer.readUInt32BE(5)
  return {streamId, type, length, flags}
}
function _unpadData (data) {
  const padLength = data.readUInt8(0)
  return data.slice(1, data.length - padLength)
}
function _bytesToPriority (priorityBytes) {
  const word = priorityBytes.readUInt32BE(0)
  const isExclusive = Boolean(word & 0x80000000)
  const streamDependency = word & 0x7FFFFFFF
  const priority = priorityBytes.readUInt8(4)
  return {priority, streamDependency, isExclusive}
}
function _byteToFlags (byte) {
  return {
    endsStream: Boolean(byte & END_STREAM),
    isAck: Boolean(byte & ACK),
    endsHeaders: Boolean(byte & END_HEADERS),
    isPadded: Boolean(byte & PADDED),
    isPriority: Boolean(byte & PRIORITY)
  }
}
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
  if (type === HEADERS) { payload = JSON.parse(payload.toString('utf8')) }
  return { type, flags, streamId, payload, priority, bytesRead }
}
module.exports = frameToHttp
