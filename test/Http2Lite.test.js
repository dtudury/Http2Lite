/* globals describe it */
const Http2Lite = require('../lib')
const { VSTREAM, FRAME, DATA, HEADERS, PING } = require('../lib/constants')
const { expect } = require('chai')

describe('Http2Lite', () => {
  describe('full single frames', () => {
    let client
    describe('constructor', () => {
      client = new Http2Lite(1)
      it('should create something', () => {
        expect(client).not.equal(undefined)
      })
    })
    const server = new Http2Lite(2)
    const serverHeadersByStream = {}
    const serverDataByStream = {}
    client.on(FRAME, frame => {
      server.writeFrame(frame)
    })
    server.on(VSTREAM, vStream => {
      vStream.on(HEADERS, headers => {
        const oldHeaders = serverHeadersByStream[vStream.streamId] || {}
        serverHeadersByStream[vStream.streamId] = Object.assign(oldHeaders, headers)
      })
      vStream.on(DATA, data => {
        const oldData = serverDataByStream[vStream.streamId] || Buffer.alloc(0)
        serverDataByStream[vStream.streamId] = Buffer.concat([oldData, data])
      })
    })
    describe('#writeHeaders()', () => {
      const headers1 = { a: 1, b: 2 }
      const clientReq = client.createVirtualStream()
      it('should send headers from end to end', () => {
        clientReq.writeHeaders(headers1)
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
      const clientReq = client.createVirtualStream()
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
  describe('partial and multiple frames', () => {
    const client = new Http2Lite(1)
    let clientOutgoingFrame = Buffer.alloc(0)
    const server = new Http2Lite(2)
    const serverDataByStream = {}
    client.on(FRAME, frame => {
      clientOutgoingFrame = Buffer.concat([clientOutgoingFrame, frame])
    })
    server.on(VSTREAM, vStream => {
      vStream.on(DATA, (data, flags) => {
        const oldData = serverDataByStream[vStream.streamId] || Buffer.alloc(0)
        serverDataByStream[vStream.streamId] = Buffer.concat([oldData, data])
      })
    })
    const clientReq = client.createVirtualStream()
    clientReq.writeData(Buffer.from('a'), false, 5)
    clientReq.writeData(Buffer.from('b'))
    clientReq.writeData(Buffer.from('c'))
    clientReq.writeData(Buffer.from('d'))
    clientReq.writeData(Buffer.from('e'), true)
    const halfway = Math.round(clientOutgoingFrame.length / 2)
    it('should understand the first 2 when sent the first 2.5 frames concatenated', () => {
      server.writeFrame(clientOutgoingFrame.slice(0, halfway))
      expect(serverDataByStream[clientReq.streamId].toString()).to.equal('ab')
    })
    it('should understand all 5 when sent the remaining 2.5 frames concatenated', () => {
      server.writeFrame(clientOutgoingFrame.slice(halfway))
      expect(serverDataByStream[clientReq.streamId].toString()).to.equal('abcde')
    })
  })
  describe('padding', () => {
    const client = new Http2Lite(1)
    const server = new Http2Lite(2)
    const sentFrames = []
    const receivedHeaders = []
    const receivedFlags = []
    client.on(FRAME, frame => {
      sentFrames.push(frame)
      server.writeFrame(frame)
    })
    server.on(VSTREAM, vStream => {
      vStream.on(HEADERS, (headers, flags) => {
        receivedHeaders.push(headers)
        receivedFlags.push(flags)
      })
    })
    const clientReq = client.createVirtualStream()
    const headers = { a: 1 }
    clientReq.writeHeaders(headers)
    it('should default to no padding', () => {
      expect(receivedFlags[0].isPadded).to.equal(false)
    })
    const padLength = 5
    clientReq.writeHeaders(headers, false, false, padLength)
    it('should increase the framesize by the padLength + 1 when padLength is set', () => {
      expect(sentFrames[1].length - sentFrames[0].length).to.equal(padLength + 1)
    })
    it('should send the payload unchanged regardless of padding', () => {
      expect(receivedHeaders[1]).to.deep.equal(headers)
    })
  })
  describe('priority', () => {
    const client = new Http2Lite(1)
    const server = new Http2Lite(2)
    const sentFrames = []
    const receivedDatas = []
    const receivedHeaders = []
    const receivedFlags = []
    const receivedPriorities = []
    client.on(FRAME, frame => {
      sentFrames.push(frame)
      server.writeFrame(frame)
    })
    server.on(VSTREAM, vStream => {
      vStream.on(DATA, (data, flags) => {
        receivedDatas.push(data)
        receivedFlags.push(flags)
      })
      vStream.on(HEADERS, (headers, flags, priority) => {
        receivedHeaders.push(headers)
        receivedFlags.push(flags)
        receivedPriorities.push(priority)
      })
    })
    const headers = { a: 1 }
    const clientReq = client.createVirtualStream()
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
    const client = new Http2Lite(1)
    const server = new Http2Lite(2)
    const sentFrames = []
    const receivedPings = []
    const receivedFlags = []
    client.on(FRAME, frame => {
      sentFrames.push(frame)
      server.writeFrame(frame)
    })
    server.vStream.on(PING, (data, flags) => {
      receivedPings.push(data)
      receivedFlags.push(flags)
    })
    const payloads = [
      Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
      Buffer.from([8, 7, 6, 5, 4, 3, 2, 1])
    ]
    client.vStream.writePing(payloads[0])
    client.vStream.writePing(payloads[1], true)
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
