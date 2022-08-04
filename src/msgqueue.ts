/**
 * 消息队列，长度100，用于消息去重
 */
export default class MsgQueue{
  private _queue = []
  private _max: number = 100
  public push(messageId: string) {
    if (this._queue.length > this._max) {
      this._queue.shift(); // 溢出
    }
    this._queue.push(messageId);
  }
  public exist(messageId: string) {
    return this._queue.includes(messageId);
  }
}
// export default Object.create({
//   _queue: [],
//   _max: 100,
//   push(messageId: string) {
//     if (this._queue.length > this._max) {
//       this._queue.shift();
//     }
//     this._queue.push(messageId);
//   },
//   exist(messageId: string) {
//     return this._queue.includes(messageId);
//   },
// });
