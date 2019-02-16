/* globals describe it */
const H2LSession = require('../lib/H2LSession')
const { H2LSTREAM, FRAME, DATA, HEADERS, PING } = require('../lib/constants')
const ui8aHelpers = require('../lib/utils/ui8aHelpers')
const { expect } = require('chai')

function ui8aFromString (string) {
  return ui8aHelpers.fromCharArray(string.split('').map(char => char.charCodeAt(0)))
}

describe('H2LSession', () => {
  describe('full single frames', () => {
    let client
    describe('constructor', () => {
      client = new H2LSession()
      it('should not fail', () => {
        expect(client).not.equal(undefined)
      })
    })
    const server = new H2LSession(2)
    const serverHeadersByStream = {}
    const serverDataByStream = {}
    client.on(FRAME, frame => {
      server.writeFrame(frame)
    })
    server.on(H2LSTREAM, h2LStream => {
      h2LStream.on(HEADERS, headers => {
        const oldHeaders = serverHeadersByStream[h2LStream.streamId] || {}
        serverHeadersByStream[h2LStream.streamId] = Object.assign(oldHeaders, headers)
      })
      h2LStream.on(DATA, data => {
        const oldData = serverDataByStream[h2LStream.streamId] || Buffer.alloc(0)
        serverDataByStream[h2LStream.streamId] = Buffer.concat([oldData, data])
      })
    })
    describe('#writeHeaders()', () => {
      const headers1 = { a: 1, b: 2 }
      const clientReq = client.request()
      it('should send headers from end to end', () => {
        clientReq.writeHeaders(headers1, false, false, 0, 1, 0, false)
        expect(headers1).to.deep.equal(serverHeadersByStream[clientReq.streamId])
      })
      const headers2 = { b: 3, c: 4 }
      it('should override headers when more are sent', () => {
        clientReq.writeHeaders(headers2)
        expect(headers1.a).to.equal(serverHeadersByStream[clientReq.streamId].a)
        expect(headers2.b).to.equal(serverHeadersByStream[clientReq.streamId].b)
        expect(headers2.c).to.equal(serverHeadersByStream[clientReq.streamId].c)
      })
    })
    describe('#writeData()', () => {
      const clientReq = client.request()
      const part1 = Buffer.from('hello ')
      it('should send data from end to end', () => {
        clientReq.writeData(part1)
        expect(part1.toString()).to.equal(serverDataByStream[clientReq.streamId].toString())
      })
      const part2 = Buffer.from('world')
      it('should append data when more is sent', () => {
        clientReq.writeData(part2)
        expect(Buffer.concat([part1, part2]).toString()).to.equal(serverDataByStream[clientReq.streamId].toString())
      })
    })
  })
  describe('too large of a payload', () => {
    const client = new H2LSession(1)
    const clientReq = client.request()
    it('should throw when too large of a payload is written', () => {
      expect(() => clientReq.writeData(Buffer.allocUnsafe(0x1000000))).to.throw()
    })
  })
  describe('partial and multiple frames', () => {
    const client = new H2LSession(1)
    let clientOutgoingFrame = Buffer.alloc(0)
    const server = new H2LSession(2)
    const serverDataByStream = {}
    client.on(FRAME, frame => {
      clientOutgoingFrame = Buffer.concat([clientOutgoingFrame, frame])
    })
    server.on(H2LSTREAM, h2LStream => {
      h2LStream.on(DATA, (data, flags) => {
        const oldData = serverDataByStream[h2LStream.streamId] || Buffer.alloc(0)
        serverDataByStream[h2LStream.streamId] = Buffer.concat([oldData, data])
      })
    })
    const clientReq = client.request()
    clientReq.writeData(Buffer.from('a'), false, 5)
    clientReq.writeData(Buffer.from('b'))
    clientReq.writeData(Buffer.from('c'))
    clientReq.writeData(Buffer.from('d'))
    clientReq.writeData(Buffer.from('e'), true)
    const barelyStarted = 10
    const halfway = Math.round(clientOutgoingFrame.length / 2)
    it('should understand nothing without the header', () => {
      server.writeFrame(clientOutgoingFrame.slice(0, barelyStarted))
    })
    it('should understand the first 2 when sent the first 2.5 frames concatenated', () => {
      server.writeFrame(clientOutgoingFrame.slice(barelyStarted, halfway))
      expect(serverDataByStream[clientReq.streamId].toString()).to.equal('ab')
    })
    it('should understand all 5 when sent the remaining 2.5 frames concatenated', () => {
      server.writeFrame(clientOutgoingFrame.slice(halfway))
      expect(serverDataByStream[clientReq.streamId].toString()).to.equal('abcde')
    })
  })
  describe('padding', () => {
    const client = new H2LSession(1)
    const server = new H2LSession(2)
    const sentFrames = []
    const receivedHeaders = []
    const receivedFlags = []
    client.on(FRAME, frame => {
      sentFrames.push(frame)
      server.writeFrame(frame)
    })
    server.on(H2LSTREAM, h2LStream => {
      h2LStream.on(HEADERS, (headers, flags) => {
        receivedHeaders.push(headers)
        receivedFlags.push(flags)
      })
    })
    const clientReq = client.request()
    const headers = { a: 1 }
    clientReq.writeHeaders(headers)
    it('should default to no padding', () => {
      expect(receivedFlags[0].isPadded).to.equal(false)
    })
    const padLength = 5
    clientReq.writeHeaders(headers, false, true, padLength, 0, 0, false)
    it('should increase the framesize by the padLength + 1 when padLength is set', () => {
      expect(sentFrames[1].length - sentFrames[0].length).to.equal(padLength + 1)
    })
    it('should send the payload unchanged regardless of padding', () => {
      expect(receivedHeaders[1]).to.deep.equal(headers)
    })
  })
  describe('priority', () => {
    const client = new H2LSession(1)
    const server = new H2LSession(2)
    const sentFrames = []
    const receivedDatas = []
    const receivedHeaders = []
    const receivedFlags = []
    const receivedPriorities = []
    client.on(FRAME, frame => {
      sentFrames.push(frame)
      server.writeFrame(frame)
    })
    server.on(H2LSTREAM, h2LStream => {
      h2LStream.on(DATA, (data, flags) => {
        receivedDatas.push(data)
        receivedFlags.push(flags)
      })
      h2LStream.on(HEADERS, (headers, flags, priority) => {
        receivedHeaders.push(headers)
        receivedFlags.push(flags)
        receivedPriorities.push(priority)
      })
    })
    const headers = { a: 1 }
    const clientReq = client.request()
    const sentPriority = 20
    const sentStreamDependency = 100
    const sentIsExclusive = true
    clientReq.writeHeaders(headers, false, false, 0, sentPriority, sentStreamDependency, sentIsExclusive)
    it('should send the prioritization data', () => {
      const { priority, streamDependency, isExclusive } = receivedPriorities[0]
      expect(sentPriority).to.equal(priority)
      expect(sentStreamDependency).to.equal(streamDependency)
      expect(sentIsExclusive).to.equal(isExclusive)
    })
    it('should send the payload unchanged regardless of priority', () => {
      expect(receivedHeaders[0]).to.deep.equal(headers)
    })
  })
  describe('ping', () => {
    const client = new H2LSession(1)
    const server = new H2LSession(2)
    const sentFrames = []
    const receivedPings = []
    const receivedFlags = []
    client.on(FRAME, frame => {
      sentFrames.push(frame)
      server.writeFrame(frame)
    })
    server.h2LStream.on(PING, (data, flags) => {
      receivedPings.push(data)
      receivedFlags.push(flags)
    })
    const payloads = [
      Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
      Buffer.from([8, 7, 6, 5, 4, 3, 2, 1])
    ]
    client.h2LStream.writePing(payloads[0])
    client.h2LStream.writePing(payloads[1], true)
    it('should send pings with the right ACK flag', () => {
      expect(receivedFlags[0].isAck).to.equal(false)
      expect(receivedFlags[1].isAck).to.equal(true)
    })
    it('should receive (8 byte) payload', () => {
      expect(receivedPings[0]).to.deep.equal(payloads[0])
      expect(receivedPings[1]).to.deep.equal(payloads[1])
    })
  })
})
