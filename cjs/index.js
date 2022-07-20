'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var mitt = _interopDefault(require('mitt'));

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
      _defineProperty(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }

  return target;
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

var defaultOptions = {
  dialogMode: "aliYunChat",
  duplexMode: "cloud",
  outputMode: "video",
  videoOpen: "0",
  format: "pcm",
  sampleRate: "16000",
  emotion: "",
  voice: "zhizhe_emo",
  characterCode: "CH_I6EenVkg9I4eXnJo",
  extInfo: "" // 扩展信息，json格式，暂时未使用，为后续新增参数预览

}; // export type callbacks = {
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

var KEEPALIVE_INTERVAL = 20 * 1000; // 20秒检查一次心跳

var OPEN = 'open';
var MESSAGE = 'message';
var ACK = 'ack';
var ERROR = 'error';
var CLOSE = 'close';
var RECONNECT = 'reconnect';
var CONNECT = 'connect';
var EVENT = 'event';

var Socket = /*#__PURE__*/function () {
  function Socket(url) {
    _classCallCheck(this, Socket);

    //  const url = getWsUrl(config);
    console.log(url, '>>>getWsUrl');
    var ws = new WebSocket(url);
    console.log(ws, '>>>ws');

    this._bindEvts(ws); // 绑定emit事件


    Object.assign(this, _objectSpread2({
      ws: ws,
      status: 'online'
    }, mitt()));
  }

  _createClass(Socket, [{
    key: "readyState",
    get: function get() {
      return this.ws.readyState;
    }
  }, {
    key: "send",
    value: function send(data) {
      this.ws.send(data);
    }
  }, {
    key: "close",
    value: function close() {
      this.status = 'offline';
      this.ws.close();
    }
  }, {
    key: "_bindEvts",
    value: function _bindEvts(ws) {
      var _this = this;

      ws.addEventListener(OPEN, function () {
        _this.emit(OPEN);
      });
      ws.addEventListener(MESSAGE, function (ev) {
        _this.emit(MESSAGE, ev.data);
      });
      ws.addEventListener(ERROR, function (err) {
        // ws.close();
        _this.emit(ERROR, err);

        _this.status = 'offline';
      });
      ws.addEventListener(CLOSE, function (err) {
        _this.emit(CLOSE, err);

        _this.status = 'offline';
      });
    }
  }]);

  return Socket;
}();

var actionQueue = Object.create({
  _queue: [],
  push: function push(action) {
    this._queue.push(action);
  },
  exec: function exec() {
    var f = this._queue.shift();

    if (typeof f === 'function') {
      f();
    }
  }
});

var Reconnect = /*#__PURE__*/function () {
  // 重连状态，防止重复连接
  function Reconnect(im) {
    _classCallCheck(this, Reconnect);

    /**
     * @param im Socket实例
     */
    this._isReconnect = false; // 默认未重连接

    this._startTime = new Date();
    this._counter = 0;
    this.im = im;
  }

  _createClass(Reconnect, [{
    key: "_reconnect",
    value: function _reconnect() {
      this.im.connect();
    }
    /**
     * 连接异常后需要用户手动操作
     * 否则可能引起死循环
     */

  }, {
    key: "_exception",
    value: function _exception() {
      this._end();

      this.im.emit(CLOSE, 'CONNECTION_CLOSED');
    }
  }, {
    key: "_start",
    value: function _start() {
      this._startTime = new Date();
      this._isReconnect = true;
    }
  }, {
    key: "_end",
    value: function _end() {
      this._counter = 0;
      this._isReconnect = false;
    }
  }, {
    key: "_backoff",
    value: function _backoff(n) {
      /* 指数避退算法 */
      var max = Math.pow(2, n + 1);
      var time = Math.floor(Math.random() * max) * 1000;
      return time;
    }
  }, {
    key: "exec",
    value: function exec(code, err) {
      var _this = this;

      // 使用指数避退算法确定重连时间，防止并发过多
      var t = this._backoff(this._counter); // 防止重复重连


      if (this._isReconnect) {
        return;
      } // 自动重连最多5次，否则需要用户手动重连


      if (++this._counter > 4) {
        /**
         * 这里不能直接重置计算器为0
         * 而是在UI上做体现，提醒用户手动重连
         * 不然会死循环
         */
        // counter = 0;
        this._exception();

        return;
      } // 倒计时后开始重连


      this._start();

      setTimeout(function () {
        try {
          _this.im.close();

          _this._reconnect();
        } catch (error) {
          _this._exception();
        }

        _this.im.emit(RECONNECT, {
          code: code,
          err: err
        });
      }, t);
    }
    /**
     * 连接成功清除相关标记
     */

  }, {
    key: "success",
    value: function success() {
      this._end();
    }
    /**
     * 连接失败后自动重连
     * @param {String} code
     */

  }, {
    key: "fail",
    value: function fail(code, err) {
      this._isReconnect = false;
      this.exec(code, err);
    }
  }]);

  return Reconnect;
}();
function getReconnect (im) {
  // const { getToken } = im.options;
  return new Reconnect(im);
}

/**
 * 处理后端传来的字符串中，json前有一个数字(code)的情况
 */
function getMsgBody(code, msg) {
  var res = null;

  try {
    res = JSON.parse(msg.replace(String(code), '')); // 只替换第一个
  } catch (e) {
    console.error(e);
  }

  return res;
}
function makeMsgBody(code, msg) {
  return "".concat(code).concat(JSON.stringify(msg));
}
/**
 * 生成sessionId的方法
 *
 */

function generateRandomId() {
  return String(Date.now()) + '_' + String(Math.random()).slice(2, 5);
}

function sayHello() {
  console.log('hello world!');
}

var AvatarIM = /*#__PURE__*/function () {
  // from startWorks 含鉴权信息等的完整url
  // sessionId
  // 用户输入options，不传全部取默认值
  // 处理消息的回调
  // from mitt
  // from mitt
  // Socket实例
  function AvatarIM(_ref) {
    var url = _ref.url,
        options = _ref.options,
        onMessageCallback = _ref.onMessageCallback;

    _classCallCheck(this, AvatarIM);

    this.sid = generateRandomId(); // 随机生成sessionId

    Object.assign(this, _objectSpread2({
      url: url,
      options: options,
      onMessageCallback: onMessageCallback
    }, mitt()));
    this._reconnect = getReconnect(this);
    this.connect(); // 初始化时建立连接
  }

  _createClass(AvatarIM, [{
    key: "connect",
    value: function connect() {
      /**尝试建立连接*/
      try {
        var im = new Socket(this.url);

        this._bindEvt(im); // 绑定imtt事件


        Object.assign(this, {
          im: im,
          _pingInterval: this._keepAlive(),
          _pongInterval: this._pong(),
          // _keepAliveTime: null,
          _preMessageTime: null
        });
      } catch (error) {
        console.log('im error', error); // 链接异常了

        this.emit(CLOSE, error);
      }
    }
    /**
    * 参考 ws.readyState
    * CONNECTING：值为0，表示正在连接。
    * OPEN：值为1，表示连接成功，可以通信了。
    * CLOSING：值为2，表示连接正在关闭。
    * CLOSED：值为3，表示连接已经关闭，或者打开连接失败。
    */

  }, {
    key: "getReadyState",
    value: function getReadyState() {
      var im = this.im;
      return typeof im.readyState === 'number' ? im.readyState : 3;
    }
    /**
    * 发送消息
    * @param {Object} data
    */

  }, {
    key: "_send",
    value: function _send(data) {
      this.im.send(data);
    }
    /**
     * 发送消息
     */

  }, {
    key: "sendMessage",
    value: function sendMessage(params) {
      var _this = this;

      if (this.getReadyState() === 1) {
        // 加上协议码
        var msg = makeMsgBody(5, params);

        this._send(msg);
      } else {
        // 消息待重连后重发
        actionQueue.push(function () {
          _this.sendMessage(params);
        }); // 非连接中状态都重连

        if (this.getReadyState() !== 0) {
          this._reconnect.exec('POSTMESSAGE');
        }
      }
    }
    /**
     * 发送ping消息
     */

  }, {
    key: "ping",
    value: function ping() {
      this._send('3');
    }
  }, {
    key: "_pong",
    value: function _pong() {
      var _this2 = this;

      return setInterval(function () {
        if (new Date().getTime() - _this2._preMessageTime > KEEPALIVE_INTERVAL * 2 + 100) {
          _this2._mockHeartbeatTimeout();

          _this2.close();
        }
      }, 60 * 1000);
    }
    /**
     * 发送事件消息
     * @param {Object} data
     */
    // sendEvent(data: any): void {
    //   this._send(makeMsgBody(7, data));
    // }

    /**
     * 重新建立im连接
     *
     * @param code 重连原因
     */

  }, {
    key: "reconnect",
    value: function reconnect(code) {
      this._reconnect.exec(code);
    }
    /**
     * 关闭IM连接
     */

  }, {
    key: "close",
    value: function close() {
      this._clearInterval();

      this.im.close();
    }
    /**
     * 模拟心跳超时消息
     * 用于前端检测断线
     */

  }, {
    key: "_mockHeartbeatTimeout",
    value: function _mockHeartbeatTimeout() {
      // 心跳超时直接重连，不需要在主仓库里写逻辑
      this._reconnect.exec('HEARTBEAT_TIMEOUT');
    } // 端上保持心跳

  }, {
    key: "_keepAlive",
    value: function _keepAlive() {
      var _this3 = this;

      return window.setInterval(function () {
        _this3._send('3');
      }, KEEPALIVE_INTERVAL);
    } // 收到后端业务消息的ack

  }, {
    key: "_ack",
    value: function _ack(messageId) {
      var ackMsg = {
        messageId: messageId
      };

      this._send(makeMsgBody(6, ackMsg));
    } // 清除定时器

  }, {
    key: "_clearInterval",
    value: function _clearInterval() {
      if (this._pingInterval) {
        clearInterval(this._pingInterval);
      }

      if (this._pongInterval) {
        clearTimeout(this._pongInterval);
      }
    }
  }, {
    key: "start",
    value: function start() {
      var _this4 = this;

      /**会话开始接口 */
      var msg = _objectSpread2({
        type: "start",
        sid: this.sid
      }, defaultOptions);

      this.options && Object.keys(this.options).forEach(function (key) {
        msg[key] = _this4.options[key] || defaultOptions[key];
      });
      this.sendMessage(msg);
    }
  }, {
    key: "suspend",
    value: function suspend() {
      /**会话开始接口 */
      var msg = {
        type: "suspend",
        sessionId: this.sid
      };
      this.sendMessage(msg);
    }
  }, {
    key: "recover",
    value: function recover() {
      var msg = {
        type: "recover",
        sessionId: this.sid
      };
      this.sendMessage(msg);
    }
  }, {
    key: "stop",
    value: function stop() {
      var msg = {
        type: "stop",
        sessionId: this.sid
      };
      this.sendMessage(msg);
    }
  }, {
    key: "sendData",
    value: function sendData(options) {
      var msg = _objectSpread2({
        type: "dataSend",
        sessionId: this.sid
      }, options);

      this.sendMessage(msg);
    }
  }, {
    key: "refreshContext",
    value: function refreshContext(options) {
      var msg = _objectSpread2({
        type: "refreshContext",
        sessionId: this.sid
      }, options);

      this.sendMessage(msg);
    }
  }, {
    key: "broadcastStatus",
    value: function broadcastStatus(sentenceId, status) {
      var msg = {
        type: "broadcastStatus",
        sessionId: this.sid,
        sentenceId: sentenceId,
        status: status
      };
    }
  }, {
    key: "_bindEvt",
    value: function _bindEvt(im) {
      var _this5 = this;

      var onOpen = function onOpen() {
        _this5._reconnect.success();

        actionQueue.exec();

        _this5.emit(OPEN);
      };

      var onError = function onError(err) {
        if (im.status === 'online') {
          _this5.emit(ERROR);

          _this5._reconnect.fail('ONERROR', err);
        }
      };

      var onClose = function onClose(err) {
        if (im.status === 'online') {
          _this5.emit(CLOSE, err);

          _this5._reconnect.fail('ONCLOSE', err);
        }
      };
      /**
       * 消息包格式：https://yuque.antfin-inc.com/alime/nsgl9g/bshnwg
       * @param {*} data
       */


      var onMessage = function onMessage(data) {
        // 建连成功的下行通知
        if (data === '1') {
          _this5.emit(CONNECT); // 建联成功发ping


          _this5._send('3');

          return;
        } // pong消息，业务无需更新，只用于保持心跳逻辑


        if (data === '4') {
          _this5._preMessageTime = new Date().getTime();
          return;
        } // ack消息


        if (data.startsWith('6')) {
          _this5.emit(ACK, getMsgBody(6, data));

          return;
        } // event消息


        if (data.startsWith('7')) {
          _this5.emit(EVENT, getMsgBody(7, data));

          return;
        } // 链接关闭


        if (data.startsWith('2')) {
          var _getMsgBody = getMsgBody(2, data),
              reason = _getMsgBody.reason;

          _this5.emit(CLOSE, reason); // 心跳超时，服务端重启，单元切流，立即重连


          if (['HEARTBEAT_TIMEOUT', 'SERVER_CONNECTION_CLOSED', 'UNIT_SWITCH'].includes(reason)) {
            _this5._reconnect.exec(reason);
          }
          /**
           * 发了这三个消息后会再重复收到socket close消息
           * 导致业务端重复断线重连的逻辑
           * 所以先将这几个消息移除
           */


          if (['CONNECTION_KICK_OUT', 'CONNECTION_TIMEOUT', 'HEARTBEAT_TIMEOUT', 'UNIT_SWITCH'].includes(reason)) {
            im.off(MESSAGE, onMessage);
            im.off(OPEN, onOpen);
            im.off(ERROR, onError);
            im.off(CLOSE, onClose); // 断开IM，断开连接

            _this5.close();
          }

          return;
        } // 业务消息


        if (data.startsWith('5')) {
          var msg = getMsgBody(5, data); // const messageId = msg.messageId;
          // // 重复的消息
          // if (msgQueue.exist(messageId)) {
          //   return;
          // }
          // this.emit(MESSAGE, msg);
          // this._ack(messageId);
          // msgQueue.push(messageId);

          _this5.onMessageCallback(msg);

          _this5._preMessageTime = new Date().getTime();
          return;
        }
      }; // 接收Socket发来的消息


      im.on(MESSAGE, onMessage);
      im.on(OPEN, onOpen);
      im.on(ERROR, onError);
      im.on(CLOSE, onClose);
    }
  }]);

  return AvatarIM;
}(); // // this.socket.onmessage = (event) => {

exports.default = AvatarIM;
exports.sayHello = sayHello;
//# sourceMappingURL=index.js.map
