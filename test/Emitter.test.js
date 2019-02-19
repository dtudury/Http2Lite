/* globals describe it */
const Emitter = require('../lib/utils/Emitter')
const { expect } = require('chai')

describe('Emitter', () => {
  it('should have an event for each event name', () => {
    const emitter = new Emitter(['a', 'b'])
    expect(emitter.events.a).not.equal(undefined)
    expect(emitter.events.b).not.equal(undefined)
    expect(emitter.events.c).equal(undefined)
    let aCounter = 0
    let bSum = 0
    function aInc () {
      aCounter++
    }
    function bAdd (n) {
      bSum += n
    }
    emitter.on('a', aInc)
    emitter.on('b', bAdd)
    emitter.emit('a')
    emitter.emit('b', 5)
    expect(aCounter).equal(1)
    expect(bSum).equal(5)
    emitter.emit('a')
    emitter.emit('b', 3)
    expect(aCounter).equal(2)
    expect(bSum).equal(8)
    emitter.off('a', aInc)
    emitter.off('b', bAdd)
    emitter.emit('a')
    emitter.emit('b', 3)
    expect(aCounter).equal(2)
    expect(bSum).equal(8)
  })
})
