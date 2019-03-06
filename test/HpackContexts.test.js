/* globals describe it */
const { expect } = require('chai')
const { HpackEncodingContext, HpackDecodingContext } = require('../lib/utils/HpackContexts')
const { SIZE_UPDATE, NOT_INDEXED, NEVER_INDEXED } = require('../lib/constants')

function _toNameValue (headers) {
  return headers.map(header => ({ name: headers.name, value: headers.value }))
}
describe('HpackContext', () => {
  describe('encode/decode', () => {
    it('encodes and decodes headers', () => {
      let headers = [
        { name: ':path', value: '/index.html' },
        { name: ':path', value: '/index.htm' },
        { name: ':path', value: '/' },
        { name: ':pat', value: '/', kind: NOT_INDEXED },
        { name: ':pat', value: '/', kind: NEVER_INDEXED },
        { name: ':pat', value: '/' },
        { name: ':pat', value: '/' },
        { maxSize: 0, kind: SIZE_UPDATE },
        { name: ':pat', value: '/' },
        { name: ':pat', value: '/' }
      ]
      let hec = new HpackEncodingContext(100)
      let encoding = hec.encode(headers)
      let hdc = new HpackDecodingContext()
      hdc.maximumTableSize = 100
      let decoding = hdc.decode(encoding)
      expect(_toNameValue(decoding)).to.deep.equal(_toNameValue(headers))
      expect(hdc.maximumTableSize).to.equal(0)
    })
  })
})
