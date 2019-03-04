/* globals describe it */
const { expect } = require('chai')
const HpackEncodingContext = require('../lib/utils/HpackEncodingContext')
const HpackDecodingContext = require('../lib/utils/HpackDecodingContext')

describe.only('HpackEncodingContext', () => {
  describe('encode', () => {
    it('encodes headers', () => {
      let hec = new HpackEncodingContext()
      let encoding = hec.encode([
        { name: ':path', value: '/index.html' },
        { name: ':path', value: '/index.htm' },
        { name: ':path', value: '/' },
        { name: ':pat', value: '/' },
        { name: ':pat', value: '/' },
        { name: ':pat', value: '/' },
        { name: ':pat', value: '/' }
      ])
      console.log(encoding)
      let hdc = new HpackDecodingContext()
      let decoding = hdc.decode(encoding)
      console.log(decoding)
      // expect(decodeInteger(new Uint8Array([0x0a]), 3).value).to.equal(10)
    })
  })
})
