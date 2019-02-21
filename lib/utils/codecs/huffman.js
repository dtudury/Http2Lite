const ui8aHelpers = require('../ui8aHelpers')
const { huffmanCodes } = require('../../constants')

const huffmanTree = []
huffmanCodes.forEach(([int, length], i) => {
  let mask = 1 << (length - 1)
  let branch = huffmanTree
  while (mask) {
    let fork = mask & int ? 1 : 0
    branch[fork] = branch[fork] || []
    if (mask !== 1) {
      branch = branch[fork]
    } else {
      branch[fork] = i
    }
    mask >>>= 1
  }
})

function _getByte (code, length, offset) {
  const rightShiftBy = length - offset - 8
  if (rightShiftBy >= 0) {
    return code >>> rightShiftBy
  } else {
    return code << -rightShiftBy
  }
}

function _stepBranch (branch, mask, byte, bytes) {
  branch = branch[mask & byte ? 1 : 0]
  if (!Array.isArray(branch)) {
    bytes.push(branch)
    branch = huffmanTree
  }
  return branch
}

function decodeHuffman (ui8a) {
  const bytes = []
  let branch = huffmanTree
  for (const byte of ui8a) {
    for (let mask = 0x80; mask; mask >>>= 1) {
      branch = _stepBranch(branch, mask, byte, bytes)
    }
  }
  return new Uint8Array(bytes)
}

function encodeHuffman (stringLiteral) {
  const codes = []
  let totalLength = 0
  for (const byte of stringLiteral) {
    let [code, length] = huffmanCodes[byte]
    const startByte = totalLength >>> 3
    const startBit = totalLength % 8
    codes.push({ code, length, startByte, startBit })
    totalLength += length
  }
  const ui8a = ui8aHelpers.alloc(Math.ceil(totalLength / 8))
  let remainder = 0
  codes.forEach(({ code, length, startByte, startBit }, index) => {
    let offset = -startBit
    while (offset <= length - 8) {
      let byte = _getByte(code, length, offset) | remainder
      ui8aHelpers.writeUInt8(ui8a, byte & 0xff, startByte++)
      remainder = 0
      offset += 8
    }
    remainder |= _getByte(code, length, offset)
  })
  if (totalLength % 8) {
    ui8aHelpers.writeUInt8(ui8a, remainder & 0xff | 0xff >>> totalLength % 8, ui8a.length - 1)
  }
  return ui8a
}

exports.decodeHuffman = decodeHuffman
exports.encodeHuffman = encodeHuffman
