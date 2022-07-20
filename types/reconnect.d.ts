import AvatarIM from './index';
export interface IReconnect {
    exec: (code: string, err?: any) => void;
    success: () => void;
    fail: (code: string, err?: any) => void;
}
export declare class Reconnect implements IReconnect {
    private _isReconnect;
    private _startTime;
    private _counter;
    private im;
    constructor(im: AvatarIM);
    private _reconnect;
    /**
     * 连接异常后需要用户手动操作
     * 否则可能引起死循环
     */
    private _exception;
    private _start;
    private _end;
    private _backoff;
    exec(code: string, err?: any): void;
    /**
     * 连接成功清除相关标记
     */
    success(): void;
    /**
     * 连接失败后自动重连
     * @param {String} code
     */
    fail(code: string, err?: any): void;
}
export default function (im: AvatarIM): Reconnect;
