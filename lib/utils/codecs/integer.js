const ui8aHelpers = require('../ui8aHelpers')
function decodeInteger (ui8a, bitOffset, byteOffset = 0) {
  const mask = 0xff >> bitOffset
  const firstByte = ui8aHelpers.readUInt8(ui8a, byteOffset++)
  let value = firstByte & mask
  if (value === mask) {
    let magnitude = 1
    let nextOctet
    do {
      nextOctet = ui8aHelpers.readUInt8(ui8a, byteOffset++)
      value += magnitude * (nextOctet & 0x7f)
      magnitude <<= 7
    } while (nextOctet & 0x80)
  }
  return { value, byteOffset, firstBits: firstByte & ~mask }
}
function encodeInteger (byte, bitOffset, value) {
  const mask = 0xff >> bitOffset
  if (byte & mask) { throw new Error('passed byte with value beyond bitOffset') }
  if (value < mask) {
    return new Uint8Array([byte | value])
  }
  const bytes = [byte | mask]
  value -= mask
  while (value > 0x7f) {
    bytes.push(0x80 | value & 0x7f)
    value >>>= 7
  }
  bytes.push(value)
  return new Uint8Array(bytes)
}

exports.decodeInteger = decodeInteger
exports.encodeInteger = encodeInteger
