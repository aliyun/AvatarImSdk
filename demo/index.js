(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["avatar-im"] = {}));
})(this, (function (exports) { 'use strict';

	//      
	// An event handler can take an optional event argument
	// and should not return a value
	                                          
	                                                               

	// An array of all currently registered event handlers for a type
	                                            
	                                                            
	// A map of event types and their corresponding event handlers.
	                        
	                                 
	                                   
	  

	/** Mitt: Tiny (~200b) functional event emitter / pubsub.
	 *  @name mitt
	 *  @returns {Mitt}
	 */
	function mitt(all                 ) {
		all = all || Object.create(null);

		return {
			/**
			 * Register an event handler for the given type.
			 *
			 * @param  {String} type	Type of event to listen for, or `"*"` for all events
			 * @param  {Function} handler Function to call in response to given event
			 * @memberOf mitt
			 */
			on: function on(type        , handler              ) {
				(all[type] || (all[type] = [])).push(handler);
			},

			/**
			 * Remove an event handler for the given type.
			 *
			 * @param  {String} type	Type of event to unregister `handler` from, or `"*"`
			 * @param  {Function} handler Handler function to remove
			 * @memberOf mitt
			 */
			off: function off(type        , handler              ) {
				if (all[type]) {
					all[type].splice(all[type].indexOf(handler) >>> 0, 1);
				}
			},

			/**
			 * Invoke all handlers for the given type.
			 * If present, `"*"` handlers are invoked after type-matched handlers.
			 *
			 * @param {String} type  The event type to invoke
			 * @param {Any} [evt]  Any value (object is recommended and powerful), passed to each handler
			 * @memberOf mitt
			 */
			emit: function emit(type        , evt     ) {
				(all[type] || []).slice().map(function (handler) { handler(evt); });
				(all['*'] || []).slice().map(function (handler) { handler(type, evt); });
			}
		};
	}

	const wsDefaultOptions = {
	    receiverId: "ability",
	    receiverType: "server",
	    sticky: true
	};
	const wsDefaultUrl = 'wss://avatar-im.console.aliyun.com/ws';
	// interface onResult {
	// 	(func:Function):void;
	// }
	// export type callbacks = {
	// 	onStartResult:onResult; // 开始结果回执 回调
	// 	onSuspendResult:onResult; // 暂停结果回执 回调
	// 	onRecoverResult:onResult; // 恢复结果回执 回调
	// 	onStopResult:onResult; // 结束结果回执 回调
	// 	onAsrContentResult:onResult; // ASR识别文本下发 回调
	// 	onReplyContentResult:onResult; // 数字人回答本文下发 回调
	// 	onBroadcastStartResult:onResult; // 一句话的播报语音开始 回调
	// 	onBroadcastEndResult:onResult; // 一句话的播报语音结束 回调
	// 	onBroadcastDataResult:onResult; // 播报音频下发 回调
	// 	onInterruptCmdResult:onResult; // 打断命令下发 回调
	// }

	const KEEPALIVE_INTERVAL = 20 * 1000; // 20秒检查一次心跳

	const OPEN = 'open';
	const MESSAGE = 'message';
	const ACK = 'ack';
	const ERROR = 'error';
	const CLOSE = 'close';
	const RECONNECT = 'reconnect';
	const CONNECT = 'connect';
	const EVENT = 'event';

	/**
	 * WebSocket
	 * https://html.spec.whatwg.org/multipage/web-sockets.html#network
	 */
	//  import { wsDefaultOptions } from '../settings/defaultOptions'
	class Socket {
	    ws;
	    status;
	    emit;
	    constructor(url) {
	        console.log('new Socket');
	        //  console.log(url, '>>>getWsUrl');
	        const ws = new WebSocket(url);
	        //  console.log(ws, '>>>ws');
	        this._bindEvts(ws); // 绑定emit事件
	        Object.assign(this, {
	            ws,
	            status: 'online',
	            ...mitt(),
	        });
	    }
	    get readyState() {
	        return this.ws.readyState;
	    }
	    send(data) {
	        this.ws.send(data);
	    }
	    close() {
	        console.log('前端触发close');
	        this.status = 'offline';
	        this.ws.close();
	    }
	    _bindEvts(ws) {
	        ws.addEventListener(OPEN, () => {
	            this.emit(OPEN);
	        });
	        ws.addEventListener(MESSAGE, ev => {
	            this.emit(MESSAGE, ev.data);
	        });
	        ws.addEventListener(ERROR, err => {
	            // ws.close();
	            this.emit(ERROR, err);
	            this.status = 'offline';
	        });
	        ws.addEventListener(CLOSE, err => {
	            this.emit(CLOSE, err);
	            this.status = 'offline';
	        });
	    }
	}

	var actionQueue = Object.create({
	    _queue: [],
	    push(action) {
	        this._queue.push(action);
	    },
	    exec() {
	        const f = this._queue.shift();
	        if (typeof f === 'function') {
	            f();
	        }
	    },
	});

	/**
	 * 消息队列，长度100，用于消息去重
	 */
	var msgQueue = Object.create({
	    _queue: [],
	    _max: 100,
	    push(messageId) {
	        if (this._queue.length > this._max) {
	            this._queue.shift();
	        }
	        this._queue.push(messageId);
	    },
	    exist(messageId) {
	        return this._queue.includes(messageId);
	    },
	});

	class Reconnect {
	    _isReconnect; // 重连状态，防止重复连接
	    _startTime;
	    _counter;
	    im;
	    constructor(im) {
	        /**
	         * @param im Socket实例
	         */
	        this._isReconnect = false; // 默认未重连接
	        this._startTime = new Date();
	        this._counter = 0;
	        this.im = im;
	    }
	    _reconnect() {
	        console.log('reconnect');
	        this.im.connect();
	    }
	    /**
	     * 连接异常后需要用户手动操作
	     * 否则可能引起死循环
	     */
	    _exception() {
	        this._end();
	        this.im.emit(CLOSE, 'CONNECTION_CLOSED');
	    }
	    _start() {
	        this._startTime = new Date();
	        this._isReconnect = true;
	    }
	    _end() {
	        this._counter = 0;
	        this._isReconnect = false;
	    }
	    _backoff(n) {
	        /* 指数避退算法 */
	        const max = Math.pow(2, n + 1);
	        const time = Math.floor(Math.random() * max) * 1000;
	        return time;
	    }
	    exec(code, err) {
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
	            }
	            catch (error) {
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
	    success() {
	        this._end();
	    }
	    /**
	     * 连接失败后自动重连
	     * @param {String} code
	     */
	    fail(code, err) {
	        this._isReconnect = false;
	        this.exec(code, err);
	    }
	}
	function getReconnect (im) {
	    // const { getToken } = im.options;
	    return new Reconnect(im);
	}

	/**
	 * 处理后端传来的字符串中，json前有一个数字(code)的情况
	 */
	function getMsgBody(code, msg) {
	    let res = null;
	    try {
	        res = JSON.parse(msg.replace(String(code), '')); // 只替换第一个
	    }
	    catch (e) {
	        console.error(e);
	    }
	    return res;
	}
	function makeMsgBody(code, msg) {
	    return `${code}${JSON.stringify(msg)}`;
	}
	/**
	 * 生成sessionId的方法
	 *
	 */
	function generateRandomId() {
	    return String(Date.now()) + '_' + String(Math.random()).slice(2, 5);
	}
	/**
	 * 拼接完整url
	 */
	function getFullUrl(url, token, appKey, tenant) {
	    return `${url}?t=${token}&app=${appKey}&tenant=${tenant}`;
	}

	class BaseIM {
	    url; // 含鉴权信息等的完整url
	    appKey;
	    sessionId; // sessionId
	    // public startOptions?: StartOptions // 用户输入options，不传全部取默认值
	    onMessageCallback; // 处理消息的回调
	    emit; // from mitt
	    on; // from mitt
	    _reconnect;
	    _preMessageTime;
	    _pingInterval;
	    _pongInterval;
	    im; // Socket实例
	    constructor({ url, token, appKey, tenant, sessionId, onMessageCallback }) {
	        url = url || wsDefaultUrl;
	        const fullUrl = getFullUrl(url, token, appKey, tenant);
	        Object.assign(this, {
	            sessionId,
	            url: fullUrl,
	            appKey,
	            onMessageCallback,
	            ...mitt()
	        });
	        this._reconnect = getReconnect(this);
	        this.connect(); // 初始化时建立连接
	    }
	    connect() {
	        console.log('-----IM connect');
	        /**尝试建立连接*/
	        try {
	            const im = new Socket(this.url);
	            this._bindEvt(im); // 绑定imtt事件
	            Object.assign(this, {
	                im,
	                _pingInterval: this._keepAlive(),
	                _pongInterval: this._pong(),
	                // _keepAliveTime: null,
	                _preMessageTime: null,
	            });
	        }
	        catch (error) {
	            console.log('im error', error);
	            // 链接异常了
	            this.emit(CLOSE, error);
	        }
	    }
	    /**
	   * 关闭IM连接
	   */
	    close() {
	        this._clearInterval();
	        this.im.close();
	    }
	    /**
	   * 发送消息
	   * @param {Object} data
	   */
	    send(data) {
	        this.im.send(data);
	    }
	    /**
	   * 发送包装好的message
	   */
	    sendMessage(content) {
	        const messageId = `msg_${generateRandomId()}`;
	        const params = {
	            messageId,
	            ...wsDefaultOptions,
	            receiverAppId: this.appKey,
	            content
	        };
	        if (this.getReadyState() === 1) {
	            // 加上协议码
	            const msg = makeMsgBody(5, params);
	            this.send(msg);
	        }
	        else {
	            // 消息待重连后重发
	            actionQueue.push(() => {
	                this.sendMessage(content);
	            });
	            // 非连接中状态都重连
	            if (this.getReadyState() !== 0) {
	                this._reconnect.exec('POSTMESSAGE');
	            }
	        }
	        return messageId;
	    }
	    /**
	   * 参考 ws.readyState
	   * CONNECTING：值为0，表示正在连接。
	   * OPEN：值为1，表示连接成功，可以通信了。
	   * CLOSING：值为2，表示连接正在关闭。
	   * CLOSED：值为3，表示连接已经关闭，或者打开连接失败。
	   */
	    getReadyState() {
	        const { im } = this;
	        return typeof im.readyState === 'number' ? im.readyState : 3;
	    }
	    /**
	     * 发送ping消息
	     */
	    ping() {
	        this.send('3');
	    }
	    _pong() {
	        return setInterval(() => {
	            if (new Date().getTime() - this._preMessageTime >
	                KEEPALIVE_INTERVAL * 2 + 100) {
	                console.log('pong超时');
	                // this._mockHeartbeatTimeout();
	                this.close();
	            }
	        }, 60 * 1000);
	    }
	    /**
	     * 发送事件消息
	     * @param {Object} data
	     */
	    // sendEvent(data: any): void {
	    //   this.send(makeMsgBody(7, data));
	    // }
	    /**
	     * 重新建立im连接
	     *
	     * @param code 重连原因
	     */
	    //  private reconnect(code: string): void {
	    //   this._reconnect.exec(code);
	    // }
	    // /**
	    //  * 模拟心跳超时消息
	    //  * 用于前端检测断线
	    //  */
	    //  private _mockHeartbeatTimeout(): void {
	    //   // 心跳超时直接重连，不需要在主仓库里写逻辑
	    //   this._reconnect.exec('HEARTBEAT_TIMEOUT');
	    // }
	    // 端上保持心跳
	    _keepAlive() {
	        return window.setInterval(() => {
	            this.send('3');
	        }, KEEPALIVE_INTERVAL);
	    }
	    // 收到后端业务消息的ack
	    // private _ack(messageId: string): void {
	    // 	const ackMsg = {
	    // 		messageId,
	    // 	};
	    // 	this.send(makeMsgBody(6, ackMsg));
	    // }
	    // 清除定时器
	    _clearInterval() {
	        if (this._pingInterval) {
	            clearInterval(this._pingInterval);
	        }
	        if (this._pongInterval) {
	            clearTimeout(this._pongInterval);
	        }
	    }
	    _bindEvt(im) {
	        this.on(MESSAGE, () => {
	        });
	        this.on(OPEN, () => {
	        });
	        const onOpen = () => {
	            this._reconnect.success();
	            actionQueue.exec();
	            this.emit(OPEN);
	        };
	        const onError = (err) => {
	            if (im.status === 'online') {
	                this.emit(ERROR);
	                this._reconnect.fail('ONERROR', err);
	            }
	        };
	        const onClose = (err) => {
	            if (im.status === 'online') {
	                this.emit(CLOSE, err);
	                this._reconnect.fail('ONCLOSE', err);
	            }
	        };
	        /**
	         * 消息包格式：https://yuque.antfin-inc.com/alime/nsgl9g/bshnwg
	         * @param {*} data
	         */
	        const onMessage = (data) => {
	            // console.log('onMessage-----',data);
	            const packetTypeId = data[0];
	            switch (packetTypeId) {
	                /**
	                    * IM 主动下行，表示当前连接已建立成功
	                */
	                case '1': {
	                    this.emit(CONNECT);
	                    // 建联成功发ping
	                    this.send('3');
	                    break;
	                }
	                /**
	                    * IM主动下行的连接断开消息，如IM的会话超时断开，连接踢除，心跳超时断开等
	                */
	                case '2': {
	                    const { reason } = getMsgBody(2, data);
	                    this.emit(CLOSE, reason);
	                    // 心跳超时，服务端重启，单元切流，立即重连
	                    if ([
	                        'HEARTBEAT_TIMEOUT',
	                        'SERVER_CONNECTION_CLOSED',
	                        'UNIT_SWITCH',
	                    ].includes(reason)) {
	                        this._reconnect.exec(reason);
	                    }
	                    /**
	                     * 发了这三个消息后会再重复收到socket close消息
	                     * 导致业务端重复断线重连的逻辑
	                     * 所以先将这几个消息移除
	                     */
	                    if ([
	                        'CONNECTION_KICK_OUT',
	                        'CONNECTION_TIMEOUT',
	                        'HEARTBEAT_TIMEOUT',
	                        'UNIT_SWITCH',
	                    ].includes(reason)) {
	                        im.off(MESSAGE, onMessage);
	                        im.off(OPEN, onOpen);
	                        im.off(ERROR, onError);
	                        im.off(CLOSE, onClose);
	                        // 断开IM，断开连接
	                        console.log('---服务端主动断开-----');
	                        this.close();
	                    }
	                    break;
	                }
	                /**
	                 * pong消息，业务无需更新，只用于保持心跳逻辑
	                 */
	                case '4': {
	                    this._preMessageTime = new Date().getTime();
	                    break;
	                }
	                /**
	                 * 业务消息
	                 */
	                case '5': {
	                    const msg = getMsgBody(5, data);
	                    const messageId = msg.messageId;
	                    // 重复的消息
	                    if (msgQueue.exist(messageId)) {
	                        return;
	                    }
	                    this.emit(MESSAGE, msg);
	                    // this._ack(messageId); // 不需要返回ack @景奕
	                    msgQueue.push(messageId);
	                    this.onMessageCallback?.(msg);
	                    this._preMessageTime = new Date().getTime();
	                    break;
	                }
	                /**
	                 * ack消息
	                 */
	                case '6': {
	                    this.emit(ACK, getMsgBody(6, data));
	                    break;
	                }
	                /**
	                 * event消息
	                 */
	                case '7': {
	                    this.emit(EVENT, getMsgBody(7, data));
	                    break;
	                }
	                default: {
	                    console.log('未知消息', data);
	                }
	            }
	        };
	        // 接收Socket发来的消息
	        im.on(MESSAGE, onMessage);
	        im.on(OPEN, onOpen);
	        im.on(ERROR, onError);
	        im.on(CLOSE, onClose);
	    }
	}

	const startDefaultOptions = {
	    dialogMode: "aliYunChat",
	    duplexMode: "cloud",
	    outputMode: "video",
	    videoOpen: "0",
	    format: "pcm",
	    sampleRate: "16000", // 音频采样率，可不传，不传默认 16K
	};

	class AvatarChatIM extends BaseIM {
	    sessionReady;
	    sessionOpen = false; // 内部判断会话是否开启
	    constructor(options) {
	        super(options);
	    }
	    startSession(options) {
	        /**会话开始接口 */
	        const msg = {
	            type: "start",
	            sessionId: this.sessionId,
	            ...startDefaultOptions
	        };
	        options && Object.keys(options).forEach((key) => {
	            msg[key] = options[key] || startDefaultOptions[key];
	        });
	        // 刷新promise
	        this.sessionReady = new Promise((resolve, reject) => {
	            this.on(MESSAGE, (msg) => {
	                if (msg.content.type === 'startResult') {
	                    this.sessionOpen = true;
	                    resolve(msg);
	                }
	            });
	        });
	        this.sendMessage(msg);
	    }
	    stopSession() {
	        if (!this.sessionOpen) {
	            throw Error('会话通道尚未开启');
	        }
	        const msg = {
	            type: "stop",
	            sessionId: this.sessionId
	        };
	        this.sendMessage(msg);
	        this.sessionOpen = false;
	        this.sessionReady = new Promise(() => { }); // 重制sessionReady为空
	    }
	    refreshContext(options) {
	        if (!this.sessionOpen) {
	            throw Error('会话通道尚未开启');
	        }
	        const msg = {
	            type: "refreshContext",
	            sessionId: this.sessionId,
	            ...options
	        };
	        this.sendMessage(msg);
	    }
	    sendText(text, duplexCommand = {}) {
	        if (!this.sessionOpen) {
	            throw Error('会话通道尚未开启');
	        }
	        const msg = {
	            type: "dataSend",
	            sessionId: this.sessionId,
	            text,
	            // duplexCommand: duplexCommand||undefined
	        };
	        this.sendMessage(msg);
	    }
	    sendAudio({ base64 }) {
	        if (!this.sessionOpen) {
	            throw Error('会话通道尚未开启');
	        }
	        const msg = {
	            type: "dataSend",
	            sessionId: this.sessionId,
	            audio: base64
	            // duplexCommand: duplexCommand||undefined
	        };
	        this.sendMessage(msg);
	    }
	    broadcastStatus(sentenceId, status) {
	        if (!this.sessionOpen) {
	            throw Error('会话通道尚未开启');
	        }
	        ({
	            type: "broadcastStatus",
	            sessionId: this.sessionId,
	            sentenceId,
	            status
	        });
	    }
	}

	if (globalThis.constructor.name === 'Window') {
	    //@ts-ignore
	    window.AvatarIM = AvatarChatIM; // 注册到window上
	    // Object.defineProperty(globalThis,'AvatarIM',AvatarChatIM); 
	}

	exports.AvatarChatIM = AvatarChatIM;
	exports.BaseIM = BaseIM;
	exports["default"] = AvatarChatIM;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.js.map
