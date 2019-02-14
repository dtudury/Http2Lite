/* globals describe it */
const ui8aHelpers = require('../lib/utils/ui8aHelpers')
const { expect } = require('chai')

describe('ui8aHelpers', () => {
  describe('alloc', () => {
    it('should return a zeroed out Uint8Array of the right size', () => {
      const size = 1000
      const ui8a = ui8aHelpers.alloc(size)
      expect(ui8a.length).to.equal(size)
      expect(ui8a instanceof Uint8Array).to.equal(true)
      const sum = ui8a.reduce((sum, ui8) => sum + ui8, 0)
      expect(sum).to.equal(0)
    })
  })

  describe('allocUnsafe', () => {
    it('should return a Uint8Array of the right size', () => {
      const size = 1000
      const ui8a = ui8aHelpers.allocUnsafe(size)
      expect(ui8a.length).to.equal(size)
      expect(ui8a instanceof Uint8Array).to.equal(true)
      const sum = ui8a.reduce((sum, ui8) => sum + ui8, 0)
      expect(sum).to.equal(0) // this isn't expected but I want to see if it ever fails
    })
  })

  describe('readUInt8', () => {
    it('should read one byte numbers', () => {
      const array = [0, 1, 127, 128, 255]
      const ui8a = ui8aHelpers.fromCharArray(array)
      for (let i = 0; i < array.length; i++) {
        expect(ui8aHelpers.readUInt8(ui8a, i)).to.equal(array[i])
      }
    })
  })

  describe('readUInt32', () => {
    it('should read four byte big endian numbers', () => {
      const array = [0, 1, 0x7f, 0x80, 0, 0, 0, 0, 0xff, 0xff, 0xff, 0xff]
      const correctValues = [0x807f0100, 0x807f01, 0x807f, 0x80, 0, 0xff000000, 0xffff0000, 0xffffff00, 0xffffffff]
      const ui8a = ui8aHelpers.fromCharArray(array)
      for (let i = 0; i < array.length - 3; i++) {
        expect(ui8aHelpers.readUInt32BE(ui8a, i)).to.equal(correctValues[i])
      }
    })
  })

  describe('writeUInt8', () => {
    it('should set the byte', () => {
      const ui8a = ui8aHelpers.alloc(3)
      ui8aHelpers.writeUInt8(ui8a, 5, 1)
      expect(ui8aHelpers.readUInt8(ui8a, 0)).to.equal(0)
      expect(ui8aHelpers.readUInt8(ui8a, 1)).to.equal(5)
      expect(ui8aHelpers.readUInt8(ui8a, 2)).to.equal(0)
    })
  })

  describe('writeUInt32BE', () => {
    it('should set the bytes of a 32 bit int in BE order', () => {
      const ui8a = ui8aHelpers.alloc(6)
      ui8aHelpers.writeUInt32BE(ui8a, 0x04030201, 1)
      expect(ui8aHelpers.readUInt8(ui8a, 0)).to.equal(0)
      expect(ui8aHelpers.readUInt8(ui8a, 1)).to.equal(4)
      expect(ui8aHelpers.readUInt8(ui8a, 2)).to.equal(3)
      expect(ui8aHelpers.readUInt8(ui8a, 3)).to.equal(2)
      expect(ui8aHelpers.readUInt8(ui8a, 4)).to.equal(1)
      expect(ui8aHelpers.readUInt8(ui8a, 5)).to.equal(0)
    })
  })

  describe('concat', () => {
    it('should concat ui8as together', () => {
      const a = ui8aHelpers.alloc(4)
      ui8aHelpers.writeUInt32BE(a, 0x11111111, 0)
      const b = ui8aHelpers.alloc(4)
      ui8aHelpers.writeUInt32BE(b, 0x22222222, 0)
      const c = ui8aHelpers.alloc(4)
      ui8aHelpers.writeUInt32BE(c, 0x33333333, 0)
      const ui8a = ui8aHelpers.concat([a, b, c])
      expect(ui8aHelpers.readUInt32BE(ui8a, 0)).to.equal(0x11111111)
      expect(ui8aHelpers.readUInt32BE(ui8a, 4)).to.equal(0x22222222)
      expect(ui8aHelpers.readUInt32BE(ui8a, 8)).to.equal(0x33333333)
    })
  })
})
