const { hpackStaticTable } = require('../constants')

/**
 * @typedef {object} TreeNode
 * @property {Number} i - index of node
 * @property {object.<TreeNode>} branches
 */

/** @type {TreeNode} */
const hpackStaticTree = { i: -1 }
hpackStaticTable.forEach((row, i) => {
  /** @type {TreeNode} */
  let node = hpackStaticTree
  row.forEach(cell => {
    if (!node.branches) {
      node.branches = {}
    }
    let nextNode = node.branches[cell] || { i }
    node.branches[cell] = nextNode
    node = nextNode
  })
})

/**
 * @param {Array<string>} path
 */
function _lookup (path) {
  /** @type {TreeNode} */
  let node = hpackStaticTree
  for (let i = 0; i < path.length; i++) {
    let cell = path[i]
    let nextStep = node.branches && node.branches[cell]
    if (!nextStep) {
      return { matches: i, i: node.i + 1 }
    }
    node = nextStep
  }
  return { matches: path.length, i: node.i + 1 }
}

/**
 * @typedef {Object} HeaderField
 * @property {string} name
 * @property {string} value
 */

// String.fromCharCode.apply(null, ui8a)

module.exports = class HpackContext {
  constructor (tableSize = 4096) {
    this._tableSize = tableSize
    this._dynamicTable = {}
  }

  /**
   * @private
   * @param {HeaderField} headerField
   * @returns {strinstring}
   */
  _encodeHeaderField (headerField) {

  }

  /**
   * @param {Array.<HeaderField>} headerFieldList
   */
  encode (headerFieldList) {
    headerFieldList.forEach(headerField => {
      let match = _lookup([headerField.name, headerField.value])
      console.log(match)
    })
  }

  /**
   * @type {Number}
   */
  get tableSize () {
    return this._tableSize
  }

  set tableSize (tableSize) {
    this._tableSize = tableSize
    this._evict()
  }

  _evict () {
  }
}
