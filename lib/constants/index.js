// --- HPack predefined static list of huffman codes ---
exports.huffmanCodes = require('./huffmanCodes')

// --- HPack predefined static list of header fields ---
exports.hPackStaticTable = require('./hPackStaticTable')

// --- Http2Lite events
exports.FRAME = 'frame'
exports.H2LSTREAM = 'h2lstream'

// --- frame types ---
exports.DATA = 0x0
exports.HEADERS = 0x1
exports.PRIORITY = 0x2
exports.RST_STREAM = 0x3
exports.SETTINGS = 0x4
exports.PUSH_PROMISE = 0x5
exports.PING = 0x6
exports.GOAWAY = 0x7
exports.WINDOW_UPDATE = 0x8
exports.CONTINUATION = 0x9

// --- flags ---
exports.END_STREAM = 0x1
exports.ACK = 0x1
exports.END_HEADERS = 0x4
exports.PADDED = 0x8
exports.PRIORITY = 0x20

// --- request pseudo headers ---
exports.METHOD = ':method'
exports.SCHEME = ':scheme'
exports.AUTHORITY = ':authority'
exports.PATH = ':path'

// --- response pseudo header ---
exports.STATUS = ':status'

// --- settings codes ---
exports.HEADER_TABLE_SIZE = 0x1
exports.ENABLE_PUSH = 0x2
exports.MAX_CONCURRENT_STREAMS = 0x3
exports.INITIAL_WINDOW_SIZE = 0x4
exports.MAX_FRAME_SIZE = 0x5
exports.MAX_HEADER_LIST_SIZE = 0x6

// --- error codes ---
exports.NO_ERROR = 0x0
exports.PROTOCOL_ERROR = 0x1
exports.INTERNAL_ERROR = 0x2
exports.FLOW_CONTROL_ERROR = 0x3
exports.SETTINGS_TIMEOUT = 0x4
exports.STREAM_CLOSED = 0x5
exports.FRAME_SIZE_ERROR = 0x6
exports.REFUSED_STREAM = 0x7
exports.CANCEL = 0x8
exports.COMPRESSION_ERROR = 0x9
exports.CONNECT_ERROR = 0xa
exports.ENHANCE_YOUR_CALM = 0xb
exports.INADEQUATE_SECURITY = 0xc
exports.HTTP_1_1_REQUIRED = 0xd

// --- HPack header indexing ---
exports.INDEXED = 0x80
exports.INCREMENTAL = 0x40
exports.SIZE_UPDATE = 0x20
exports.NEVER_INDEXED = 0x10
exports.NOT_INDEXED = 0x00

exports.HPACK_HEADER_OFFSETS = {
  [exports.INDEXED]: 1,
  [exports.INCREMENTAL]: 2,
  [exports.SIZE_UPDATE]: 3,
  [exports.NEVER_INDEXED]: 4,
  [exports.NOT_INDEXED]: 4
}
