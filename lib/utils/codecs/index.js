const { decodeInteger, encodeInteger } = require('./hpack/integer')
const { decodeHuffman, encodeHuffman } = require('./hpack/huffman')
const { decodeStringLiteral, encodeStringLiteral } = require('./hpack/stringLiteral')
const { decodeHeader, encodeHeader } = require('./hpack/header')

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
exports.frameToHttp = require('./http2/frameToHttp')
exports.httpToFrame = require('./http2/httpToFrame')
