import Socket from './socket';
import { Reconnect } from './reconnect';
declare type StartOptions = {
    dialogMode?: "cloud" | "aliYunChat";
    duplexMode?: "cloud" | "client" | "blend";
    outputMode?: "video" | "audio";
    videoOpen?: "0" | "1";
    format?: string;
    sampleRate?: string;
    emotion?: string;
    voice?: string;
    characterCode?: string;
    extInfo?: string;
} | {};
declare type AvatarIMInput = {
    url: string;
    token: string;
    appKey: string;
    tenant: string;
    onMessageCallback: Function;
};
export default class AvatarIM {
    url: string;
    appKey: string;
    sessionId: string;
    onMessageCallback: Function;
    emit: any;
    on: any;
    im: Socket;
    sessionReady: Promise<any>;
    protected _reconnect: Reconnect;
    protected _preMessageTime: number;
    protected _pingInterval: any;
    protected _pongInterval: any;
    private sessionOpen;
    constructor({ url, token, appKey, tenant, onMessageCallback }: AvatarIMInput);
    connect(): void;
    /**
   * 关闭IM连接
   */
    close(): void;
    start(startOptions: StartOptions): void;
    suspend(): void;
    recover(): void;
    stop(): void;
    refreshContext(options: any): void;
    sendText(text: string, duplexCommand?: {}): void;
    sendAudio(audio: string, duplexCommand?: {}): void;
    broadcastStatus(sentenceId: string, status: string): void;
    /**
   * 参考 ws.readyState
   * CONNECTING：值为0，表示正在连接。
   * OPEN：值为1，表示连接成功，可以通信了。
   * CLOSING：值为2，表示连接正在关闭。
   * CLOSED：值为3，表示连接已经关闭，或者打开连接失败。
   */
    private getReadyState;
    /**
   * 发送消息
   * @param {Object} data
   */
    private _send;
    /**
     * 发送消息
     */
    private sendMessage;
    /**
     * 发送ping消息
     */
    private ping;
    private _pong;
    /**
     * 发送事件消息
     * @param {Object} data
     */
    /**
     * 重新建立im连接
     *
     * @param code 重连原因
     */
    private reconnect;
    /**
     * 模拟心跳超时消息
     * 用于前端检测断线
     */
    private _mockHeartbeatTimeout;
    private _keepAlive;
    private _ack;
    private _clearInterval;
    private _bindEvt;
}
export {};
