/* globals describe it */
const Uint8ArrayHelpers = require('../lib/utils/Uint8ArrayHelpers')
const { expect } = require('chai')

describe('Uint8ArrayHelpers', () => {
  describe('alloc', () => {
    it('should return a zeroed out Uint8Array of the right size', () => {
      const size = 1000
      const ui8a = Uint8ArrayHelpers.alloc(size)
      expect(ui8a.length).to.equal(size)
      expect(ui8a instanceof Uint8Array).to.equal(true)
      const sum = ui8a.reduce((sum, ui8) => sum + ui8, 0)
      expect(sum).to.equal(0)
    })
  })

  describe('allocUnsafe', () => {
    it('should return a Uint8Array of the right size', () => {
      const size = 1000
      const ui8a = Uint8ArrayHelpers.allocUnsafe(size)
      expect(ui8a.length).to.equal(size)
      expect(ui8a instanceof Uint8Array).to.equal(true)
      const sum = ui8a.reduce((sum, ui8) => sum + ui8, 0)
      expect(sum).to.equal(0) // this isn't expected but I want to see if it ever fails
    })
  })

  describe('readUInt8', () => {
    it('should read one byte numbers', () => {
      let array = [0, 1, 127, 128, 255]
      const ui8a = Uint8ArrayHelpers.fromArray(array)
      for (let i = 0; i < array.length; i++) {
        expect(Uint8ArrayHelpers.readUInt8(ui8a, i)).to.equal(array[i])
      }
    })
  })

  describe('readUInt32', () => {
    it('should read four byte big endian numbers', () => {
      let array = [0, 1, 0x7f, 0x80, 0, 0, 0, 0, 0xff, 0xff, 0xff, 0xff]
      let correctValues = [ 0x807f0100, 0x807f01, 0x807f, 0x80, 0, 0xff000000, 0xffff0000, 0xffffff00, 0xffffffff ]
      const ui8a = Uint8ArrayHelpers.fromArray(array)
      for (let i = 0; i < array.length - 3; i++) {
        expect(Uint8ArrayHelpers.readUInt32BE(ui8a, i)).to.equal(correctValues[i])
      }
    })
  })
})
