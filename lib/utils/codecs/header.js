const ui8aHelpers = require('../ui8aHelpers')
const { HPACK_HEADER_OFFSETS, INDEXED, INCREMENTAL, NOT_INDEXED, NEVER_INDEXED, SIZE_UPDATE } = require('../../constants')
const { decodeInteger, encodeInteger } = require('./integer')
const { decodeStringLiteral } = require('./stringLiteral')

function _decodeIntegerIntoHeader (ui8a, header, name, bitOffset) {
  let decodedInteger = decodeInteger(ui8a, bitOffset, header.byteOffset)
  header[name] = decodedInteger.value
  header.byteOffset = decodedInteger.byteOffset
  return header
}

function _decodeStringLiteralIntoHeader (ui8a, header, name) {
  let decodedStringLiteral = decodeStringLiteral(ui8a, header.byteOffset)
  header[name] = decodedStringLiteral
  header.byteOffset = decodedStringLiteral.byteOffset
  return header
}

function _readKind (ui8a, byteOffset) {
  const firstByte = ui8aHelpers.readUInt8(ui8a, byteOffset)
  if (firstByte & NEVER_INDEXED) {
    return NEVER_INDEXED
  } else if (firstByte & SIZE_UPDATE) {
    return SIZE_UPDATE
  } else if (firstByte & INCREMENTAL) {
    return INCREMENTAL
  } else if (firstByte & INDEXED) {
    return INDEXED
  } else {
    return NOT_INDEXED
  }
}

function decodeHeader (ui8a, byteOffset = 0) {
  const kind = _readKind(ui8a, byteOffset)
  const offset = HPACK_HEADER_OFFSETS[kind]
  let header = { kind, byteOffset }
  if (kind === SIZE_UPDATE) {
    _decodeIntegerIntoHeader(ui8a, header, 'maxSize', offset)
  } else if (kind === INDEXED) {
    _decodeIntegerIntoHeader(ui8a, header, 'index', offset)
  } else {
    _decodeIntegerIntoHeader(ui8a, header, 'index', offset)
    if (!header.index) {
      _decodeStringLiteralIntoHeader(ui8a, header, 'name')
    }
    _decodeStringLiteralIntoHeader(ui8a, header, 'value')
  }
  return header
}

function encodeHeader (kind, index, name, value) {
  const offset = HPACK_HEADER_OFFSETS[kind]
  if (!offset) {
    throw new Error(`unknown header kind: ${kind}`)
  }
  const headerParts = [encodeInteger(kind, offset, index)]
  if (name) {
    headerParts.push(name)
  }
  if (value) {
    headerParts.push(value)
  }
  return ui8aHelpers.concat(headerParts)
}

exports.decodeHeader = decodeHeader
exports.encodeHeader = encodeHeader
