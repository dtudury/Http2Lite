/* globals describe it */
const { expect } = require('chai')
const { HpackEncodingContext, HpackDecodingContext } = require('../lib/utils/HpackContexts')

describe('HpackContext', () => {
  describe('encode/decode', () => {
    it('encodes and decodes headers', () => {
      let headers = [
        { name: ':path', value: '/index.html' },
        { name: ':path', value: '/index.htm' },
        { name: ':path', value: '/' },
        { name: ':pat', value: '/' },
        { name: ':pat', value: '/' },
        { name: ':pat', value: '/' },
        { name: ':pat', value: '/' }
      ]
      let hec = new HpackEncodingContext()
      let encoding = hec.encode(headers)
      let hdc = new HpackDecodingContext()
      let decoding = hdc.decode(encoding)
      expect(decoding).to.deep.equal(headers)
      expect(() => {
        hdc.decode(new Uint8Array([0]))
      }).to.throw()
    })
  })
  describe('_evict', () => {
    it('shrinks table size appropriately', () => {
    })
  })
})
