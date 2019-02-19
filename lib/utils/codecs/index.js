const { decodeInteger, encodeInteger } = require('./integer')
const { decodeHuffman, encodeHuffman } = require('./huffman')
const { decodeStringLiteral, encodeStringLiteral } = require('./stringLiteral')
const { decodeHeader, encodeHeader } = require('./header')

// HPack transcoders
exports.decodeInteger = decodeInteger
exports.encodeInteger = encodeInteger
exports.decodeHuffman = decodeHuffman
exports.encodeHuffman = encodeHuffman
exports.decodeStringLiteral = decodeStringLiteral
exports.encodeStringLiteral = encodeStringLiteral
exports.decodeHeader = decodeHeader
exports.encodeHeader = encodeHeader

// HTTP2 transcoders
exports.frameToHttp = require('./frameToHttp')
exports.httpToFrame = require('./httpToFrame')
