/**
 * 消息队列，长度100，用于消息去重
 */
export default Object.create({
  _queue: [],
  _max: 100,
  push(messageId: string) {
    if (this._queue.length > this._max) {
      this._queue.shift();
    }
    this._queue.push(messageId);
  },
  exist(messageId: string) {
    return this._queue.includes(messageId);
  },
});
