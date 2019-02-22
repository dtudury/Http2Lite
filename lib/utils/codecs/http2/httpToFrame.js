const { encodeRequest } = require('./request')

function httpToFrame (streamId, type, payload, endStreamOrIsAck, endHeaders, padLength, priority, streamDependency, isExclusive) {
  const request = {
    type,
    flags: {
      endStream: endStreamOrIsAck,
      isAck: endStreamOrIsAck,
      endHeaders,
      isPadded: Boolean(padLength),
      isPriority: Boolean(priority)
    },
    streamId,
    padLength,
    payload,
    priority: {
      priority,
      streamDependency,
      isExclusive
    }
  }
  return encodeRequest(request)
}

module.exports = httpToFrame
