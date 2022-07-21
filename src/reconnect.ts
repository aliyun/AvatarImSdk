import { CLOSE, RECONNECT } from './const';
import AvatarIM  from './index'
export interface IReconnect {
  exec: (code: string, err?: any) => void;
  success: () => void;
  fail: (code: string, err?: any) => void;
}

export class Reconnect implements IReconnect {
  private _isReconnect: boolean; // 重连状态，防止重复连接
  private _startTime: Date;
  private _counter: number;
  private im: AvatarIM;
  constructor(im:AvatarIM) {
    /**
     * @param im Socket实例
     */
    this._isReconnect = false; // 默认未重连接
    this._startTime = new Date();
    this._counter = 0;
    this.im = im;
  }

  private _reconnect(): void {
    console.log('reconnect');
    this.im.connect();
  }
  /**
   * 连接异常后需要用户手动操作
   * 否则可能引起死循环
   */
  private _exception(): void {
    this._end();
    this.im.emit(CLOSE, 'CONNECTION_CLOSED');
  }
  private _start(): void {
    this._startTime = new Date();
    this._isReconnect = true;
  }
  private _end(): void {
    this._counter = 0;
    this._isReconnect = false;
  }
  private _backoff(n: number): number {
    /* 指数避退算法 */
    const max = Math.pow(2, n + 1);
    const time = Math.floor(Math.random() * max) * 1000;
    return time;
  }
  exec(code: string, err?: any): void {
    console.log(this._counter);
    // 使用指数避退算法确定重连时间，防止并发过多
    const t = this._backoff(this._counter);
    // 防止重复重连
    if (this._isReconnect) {
      return;
    }
    // 自动重连最多5次，否则需要用户手动重连
    if (++this._counter > 4) {
      /**
       * 这里不能直接重置计算器为0
       * 而是在UI上做体现，提醒用户手动重连
       * 不然会死循环
       */
      // counter = 0;
      this._exception();
      return;
    }
    // 倒计时后开始重连
    this._start();
    setTimeout(() => {
      try {
        this.im.close();
        this._reconnect();
      } catch (error) {
        this._exception();
      }
      this.im.emit(RECONNECT, {
        code,
        err,
      });
    }, t);
  }
  /**
   * 连接成功清除相关标记
   */
  success(): void {
    this._end();
  }
  /**
   * 连接失败后自动重连
   * @param {String} code
   */
  fail(code: string, err?: any): void {
    this._isReconnect = false;
    this.exec(code, err);
  }
}

export default function (im : AvatarIM) : Reconnect {
  // const { getToken } = im.options;
  return new Reconnect(im);
}
