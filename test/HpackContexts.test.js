/* globals describe it */
const { expect } = require('chai')
const HpackEncodingContext = require('../lib/utils/HpackEncodingContext')

describe.only('HpackEncodingContext', () => {
  describe('encode', () => {
    it('encodes headers', () => {
      let hec = new HpackEncodingContext()
      hec.encode([{ name: ':path', value: '/index.html' }])
      hec.encode([{ name: ':path', value: '/index.htm' }])
      hec.encode([{ name: ':path', value: '/' }])
      hec.encode([{ name: ':pat', value: '/' }])
      // expect(decodeInteger(new Uint8Array([0x0a]), 3).value).to.equal(10)
    })
  })
})
