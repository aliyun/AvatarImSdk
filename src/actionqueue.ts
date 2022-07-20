export default Object.create({
  _queue: [],
  push(action: Function): void {
    this._queue.push(action);
  },
  exec(): void {
    const f = this._queue.shift();
    if (typeof f === 'function') {
      f();
    }
  },
});
