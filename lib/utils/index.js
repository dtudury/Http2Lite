const { decodeInteger, encodeInteger } = require('./codecs/integer')
const { decodeHuffman, encodeHuffman } = require('./codecs/huffman')
const { decodeStringLiteral, encodeStringLiteral } = require('./codecs/stringLiteral')
const { decodeHeader, encodeHeader } = require('./codecs/header')

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
