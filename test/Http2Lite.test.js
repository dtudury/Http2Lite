/* globals describe it */
const H2LSession = require('../lib/H2LSession')
const { H2LSTREAM, FRAME, DATA, HEADERS, PING } = require('../lib/constants')
const ui8aHelpers = require('../lib/utils/ui8aHelpers')
const { expect } = require('chai')

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
      h2LStream.on(HEADERS, request => {
        const oldHeaders = serverHeadersByStream[h2LStream.streamId] || {}
        serverHeadersByStream[h2LStream.streamId] = Object.assign(oldHeaders, request.payload)
      })
      h2LStream.on(DATA, request => {
        const oldData = serverDataByStream[h2LStream.streamId] || ui8aHelpers.alloc(0)
        serverDataByStream[h2LStream.streamId] = ui8aHelpers.concat([oldData, request.payload])
      })
    })
    describe('#writeData()', () => {
      const clientReq = client.request()
      const part1 = new Uint8Array([1, 2, 3, 4])
      it('should send data from end to end', () => {
        clientReq.writeRequest({ type: DATA, payload: part1 })
        expect(part1).to.deep.equal(serverDataByStream[clientReq.streamId])
      })
      const part2 = new Uint8Array([5, 6, 7, 8])
      it('should append data when more is sent', () => {
        clientReq.writeRequest({ type: DATA, payload: part2 })
        expect(ui8aHelpers.concat([part1, part2])).to.deep.equal(serverDataByStream[clientReq.streamId])
      })
    })
  })
  describe('too large of a payload', () => {
    const client = new H2LSession(1)
    const clientReq = client.request()
    it('should throw when too large of a payload is written', () => {
      expect(() => clientReq.writeRequest({ type: DATA, payload: ui8aHelpers.allocUnsafe(0x1000000) })).to.throw()
    })
  })
  describe('partial and multiple frames', () => {
    const client = new H2LSession(1)
    let clientOutgoingFrame = ui8aHelpers.alloc(0)
    const server = new H2LSession(2)
    const serverDataByStream = {}
    client.on(FRAME, frame => {
      clientOutgoingFrame = ui8aHelpers.concat([clientOutgoingFrame, frame])
    })
    server.on(H2LSTREAM, h2LStream => {
      h2LStream.on(DATA, request => {
        const oldData = serverDataByStream[h2LStream.streamId] || ui8aHelpers.alloc(0)
        serverDataByStream[h2LStream.streamId] = ui8aHelpers.concat([oldData, request.payload])
      })
    })
    const clientReq = client.request()
    clientReq.writeRequest({ type: DATA, payload: new Uint8Array([1]), flags: { isPadded: true }, padLength: 5 })
    clientReq.writeRequest({ type: DATA, payload: new Uint8Array([2]) })
    clientReq.writeRequest({ type: DATA, payload: new Uint8Array([3]) })
    clientReq.writeRequest({ type: DATA, payload: new Uint8Array([4]) })
    clientReq.writeRequest({ type: DATA, payload: new Uint8Array([5]), flags: { endStream: true } })
    const barelyStarted = 10
    const halfway = Math.round(clientOutgoingFrame.length / 2)
    it('should understand nothing without the header', () => {
      server.writeFrame(clientOutgoingFrame.slice(0, barelyStarted))
    })
    it('should understand the first 2 when sent the first 2.5 frames concatenated', () => {
      server.writeFrame(clientOutgoingFrame.slice(barelyStarted, halfway))
      expect(serverDataByStream[clientReq.streamId]).to.deep.equal(new Uint8Array([1, 2]))
    })
    it('should understand all 5 when sent the remaining 2.5 frames concatenated', () => {
      server.writeFrame(clientOutgoingFrame.slice(halfway))
      expect(serverDataByStream[clientReq.streamId]).to.deep.equal(new Uint8Array([1, 2, 3, 4, 5]))
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
      h2LStream.on(HEADERS, request => {
        receivedHeaders.push(request.payload)
        receivedFlags.push(request.flags)
      })
    })
    const clientReq = client.request()
    const headers = new Uint8Array([1, 2, 3, 4])
    clientReq.writeRequest({ type: HEADERS, payload: headers })
    it('should default to no padding', () => {
      expect(receivedFlags[0].isPadded).to.equal(false)
    })
    const padLength = 5
    clientReq.writeRequest({ type: HEADERS, payload: headers, flags: { endHeaders: true, isPadded: true }, padLength })
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
      h2LStream.on(DATA, request => {
        receivedDatas.push(request.payload)
        receivedFlags.push(request.flags)
      })
      h2LStream.on(HEADERS, request => {
        receivedHeaders.push(request.payload)
        receivedFlags.push(request.flags)
        receivedPriorities.push(request.priority)
      })
    })

    const headers = new Uint8Array([1, 2, 3, 4])
    const clientReq = client.request()
    const sentPriority = 20
    const sentStreamDependency = 100
    const sentIsExclusive = true
    clientReq.writeRequest({ type: HEADERS, payload: headers, flags: { isPriority: true }, priority: { priority: sentPriority, streamDependency: sentStreamDependency, isExclusive: sentIsExclusive } })
    it('should send the prioritization data', () => {
      const { priority, streamDependency, isExclusive } = receivedPriorities[0]
      expect(sentPriority).to.equal(priority)
      expect(sentStreamDependency).to.equal(streamDependency)
      expect(sentIsExclusive).to.equal(isExclusive)
    })
    const sentIsExclusive2 = false
    clientReq.writeRequest({ type: HEADERS, payload: headers, flags: { isPriority: true }, priority: { streamDependency: sentStreamDependency, isExclusive: sentIsExclusive2 } })
    it('should send the prioritization data (not exclusive)', () => {
      const { streamDependency, isExclusive } = receivedPriorities[1]
      expect(sentStreamDependency).to.equal(streamDependency)
      expect(sentIsExclusive2).to.equal(isExclusive)
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
    server.h2LStream.on(PING, request => {
      receivedPings.push(request.payload)
      receivedFlags.push(request.flags)
    })
    const payloads = [
      new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
      new Uint8Array([8, 7, 6, 5, 4, 3, 2, 1])
    ]
    client.h2LStream.writeRequest({ type: PING, payload: payloads[0] })
    client.h2LStream.writeRequest({ type: PING, payload: payloads[1], flags: { isAck: true } })
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
