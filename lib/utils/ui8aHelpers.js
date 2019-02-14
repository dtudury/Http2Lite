/**
 * @param {Number} size
 * @returns {Uint8Array}
 */
function alloc (size) {
  return (new Uint8Array(size)).fill(0)
}

/**
 * @param {Number} size
 * @returns {Uint8Array}
 */
function allocUnsafe (size) {
  return new Uint8Array(size)
}

/**
 * @param {Uint8Array} ui8a
 * @param {Number} offset
 * @returns {Number}
 */
function readUInt8 (ui8a, offset) {
  return ui8a[offset]
}

/**
 * @param {Uint8Array} ui8a
 * @param {Number} offset
 * @returns {Number}
 */
function readUInt32BE (ui8a, offset) {
  return (ui8a[offset] | ui8a[offset + 1] << 8 | ui8a[offset + 2] << 16 | ui8a[offset + 3] << 24) >>> 0
}

/**
 * @param {Uint8Array} ui8a
 * @param {Number} value
 * @param {Number} offset
 */
function writeUInt8 (ui8a, value, offset) {
  ui8a[offset] = value
}

/**
 * @param {Uint8Array} ui8a
 * @param {Number} value
 * @param {Number} offset
 */
function writeUInt32BE (ui8a, value, offset) {
  ui8a.set([value >>> 24 & 0xff, value >>> 16 & 0xff, value >>> 8 & 0xff, value & 0xff], offset)
}

/**
 * @param {Array.<Uint8Array>} ui8as
 * @returns {Uint8Array}
 */
function concat (ui8as) {
  const ui8a = new Uint8Array(ui8as.reduce((sum, ui8a) => sum + ui8a.length, 0))
  let offset = 0
  ui8as.forEach(chunk => {
    ui8a.set(chunk, offset)
    offset += chunk.length
  })
  return ui8a
}

/**
 * @param {Array.<Number>} Array
 * @returns {Uint8Array}
 */
function fromCharArray (array) {
  const ui8a = new Uint8Array(array.length)
  ui8a.set(array, 0)
  return ui8a
}

exports.alloc = alloc
exports.allocUnsafe = allocUnsafe
exports.readUInt8 = readUInt8
exports.readUInt32BE = readUInt32BE
exports.writeUInt8 = writeUInt8
exports.writeUInt32BE = writeUInt32BE
exports.concat = concat
exports.fromCharArray = fromCharArray
