import mitt from 'mitt';

import { startDefaultOptions,wsDefaultOptions } from '../settings/defaultOptions'
import { KEEPALIVE_INTERVAL } from '../settings/params'
import { OPEN, MESSAGE, ACK, ERROR, CLOSE, CONNECT, EVENT } from './const';
import Socket from './socket';
import actionQueue from './actionqueue';
import msgQueue from './msgqueue';
import getReconnect, {Reconnect} from './reconnect';
import { getMsgBody, makeMsgBody, generateRandomId, getFullUrl } from './util';

// const wsServer="";

// options.onstartResult;

// client.onstartResult = ()=>{

// }

type StartOptions = {
	dialogMode?: "cloud" | "aliYunChat"; // 对话模式：open:开放域对话 , aliYunChat 云小蜜对话，默认aliYunChat
	duplexMode?: "cloud" | "client" | "blend"; // 双工模式：cloud:全云模式（默认），client:全客户端模式，blend：混合模式（端云模式）
	outputMode?: "video" | "audio"; // 输出模式：video:视频(全云的视频输出需要先startWork去启动pod)，默认 ,audio:音频
	videoOpen?: "0" | "1"; // 是否视频开启 0：未开启，默认 1：开启
	format?: string; // 音频格式，可不传，不传默认 pcm
	sampleRate?: string; // 音频采样率，可不传，不传默认 16K
	emotion?: string; // 情感标签 可选，为了可以指定发音人情感
	voice?: string; // 发音人名称 可选，为了能指定发音人
	characterCode?: string; // 人物code
	extInfo? : string; // 扩展信息，json格式，暂时未使用，为后续新增参数预览
} | {}

// type openMsg = {
// 	type : string,
// 	sessionId : string
// } & options
// interface onResult {
// 	(func:Function):void;
// }

type AvatarIMInput = {
	url: string; // wss url
	token: string;
	appKey: string;
	tenant: string;
	// startOptions?: StartOptions; // 会话开始参数，不传全部取默认值
	onMessageCallback: Function // 处理消息的回调
}

export default class AvatarIM{
	public url: string; // 含鉴权信息等的完整url
	public appKey: string;
	public sessionId : string; // sessionId
	// public startOptions?: StartOptions // 用户输入options，不传全部取默认值
	public onMessageCallback: Function // 处理消息的回调
	public emit: any; // from mitt
  public on: any; // from mitt
	public im: Socket; // Socket实例
	public sessionReady: Promise<any>;

	protected _reconnect: Reconnect;
	protected _preMessageTime: number;
  protected _pingInterval: any;
  protected _pongInterval: any;

	private sessionOpen: boolean = false; // 会话是否开启
	

	constructor({url,token, appKey, tenant,onMessageCallback}:AvatarIMInput){
		const sessionId =  generateRandomId(); // 随机生成sessionId
		const fullUrl = getFullUrl(url,token, appKey, tenant);
		Object.assign(this,{ // 用户输入注册到this
			sessionId,
			url:fullUrl,
			appKey,
			onMessageCallback,
			...mitt()
		})

		this.sessionReady = new Promise((resolve,reject)=>{
			this.on(MESSAGE,(msg)=>{
				if(msg.content.type === 'startResult'){
					this.sessionOpen = true;
					resolve(msg);
				}
			})
		})
    this._reconnect = getReconnect(this);
		this.connect(); // 初始化时建立连接
	}

	public connect(){
		/**尝试建立连接*/
		try{
			const im = new Socket(this.url);
			this._bindEvt(im); // 绑定imtt事件
			Object.assign(this, {
				im,
				_pingInterval: this._keepAlive(),
				_pongInterval: this._pong(),
				// _keepAliveTime: null,
				_preMessageTime: null,
			});
		} catch (error) {
			console.log('im error', error);
			// 链接异常了
			this.emit(CLOSE, error);
		}
	}
	
	/**
   * 关闭IM连接
   */
	public close(): void {
		this._clearInterval();
		this.im.close();
	}

	public start(startOptions:StartOptions){
		/**会话开始接口 */
		const msg = {
			type:"start",
			sessionId:this.sessionId,
			...startDefaultOptions
		};
		startOptions && Object.keys(startOptions).forEach((key) => {
			msg[key] = startOptions![key] || startDefaultOptions[key];
		})
		this.sendMessage(msg);
	}

	public suspend(){
		/**会话开始暂停 */
		if(!this.sessionOpen){
			throw Error('会话通道尚未开启');
		}
		const msg = {
			type:"suspend",
			sessionId:this.sessionId
		};
		this.sendMessage(msg);
	}

	public recover(){
		if(!this.sessionOpen){
			throw Error('会话通道尚未开启');
		}
		const msg = {
			type:"recover",
			sessionId:this.sessionId
		};
		this.sendMessage(msg);
	}

	public stop(){
		if(!this.sessionOpen){
			throw Error('会话通道尚未开启');
		}
		const msg = {
			type:"stop",
			sessionId:this.sessionId
		};
		this.sendMessage(msg);
	}

	public refreshContext(options){
		if(!this.sessionOpen){
			throw Error('会话通道尚未开启');
		}
		const msg = {
			type:"refreshContext",
			sessionId:this.sessionId,
			...options
		};
		this.sendMessage(msg);
	}

	public sendText(text:string,duplexCommand={}){
		if(!this.sessionOpen){
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

	public sendAudio(audio:string,duplexCommand={}){
		if(!this.sessionOpen){
			throw Error('会话通道尚未开启');
		}
		const msg = {
			type:"dataSend",
			sessionId:this.sessionId,
			audio,
			// duplexCommand: duplexCommand||undefined
		};
		this.sendMessage(msg);
	}

	public broadcastStatus(sentenceId:string,status:string){
		if(!this.sessionOpen){
			throw Error('会话通道尚未开启');
		}
		const msg = {
			type:"broadcastStatus",
			sessionId:this.sessionId,
			sentenceId,
			status
		}
	}
	
	// public connectReady(){
	// 	return new Promise((resolve,reject) => {

	// 	})
	// }
	// public sessionReady(){
	// 	/**
	// 	 * 会话开始
	// 	 */
	// 	return 
	// }
	/**
   * 参考 ws.readyState
   * CONNECTING：值为0，表示正在连接。
   * OPEN：值为1，表示连接成功，可以通信了。
   * CLOSING：值为2，表示连接正在关闭。
   * CLOSED：值为3，表示连接已经关闭，或者打开连接失败。
   */
  private getReadyState(): number {
    const { im } = this;
    return typeof im.readyState === 'number' ? im.readyState : 3;
  }

	/**
   * 发送消息
   * @param {Object} data
   */
	private _send(data: string): void {
		this.im.send(data);
	}
	
  /**
   * 发送消息
   */
  private sendMessage(content: object): void {
		const params = {
			messageId: `msg_${generateRandomId()}`,
			...wsDefaultOptions,
			receiverAppId: this.appKey,
			content
		}
    if (this.getReadyState() === 1) {
      // 加上协议码
      const msg = makeMsgBody(5, params);
      this._send(msg);
    } else {
      // 消息待重连后重发
      actionQueue.push(() => {
        this.sendMessage(content);
      });
      // 非连接中状态都重连
      if (this.getReadyState() !== 0) {
        this._reconnect.exec('POSTMESSAGE');
      }
    }
  }
  /**
   * 发送ping消息
   */
  private ping(): void {
    this._send('3');
  }

	private _pong(): any {
    return setInterval(() => {
      if (
        new Date().getTime() - this._preMessageTime >
        KEEPALIVE_INTERVAL * 2 + 100
      ) {
        this._mockHeartbeatTimeout();
        this.close();
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
  private reconnect(code: string): void {
    this._reconnect.exec(code);
  }

  /**
   * 模拟心跳超时消息
   * 用于前端检测断线
   */
  private _mockHeartbeatTimeout(): void {
    // 心跳超时直接重连，不需要在主仓库里写逻辑
    this._reconnect.exec('HEARTBEAT_TIMEOUT');
  }

  // 端上保持心跳
  private _keepAlive(): number {
    return window.setInterval(() => {
      this._send('3');
    }, KEEPALIVE_INTERVAL);
  }

  // 收到后端业务消息的ack
  private _ack(messageId: string): void {
    const ackMsg = {
      messageId,
    };
    this._send(makeMsgBody(6, ackMsg));
  }

  // 清除定时器
  private _clearInterval(): void {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
    }
    if (this._pongInterval) {
      clearTimeout(this._pongInterval);
    }
  }
	
	
	private _bindEvt(im: any): void {
		this.on(MESSAGE,()=>{

		})
		this.on(OPEN, ()=>{

		})

    const onOpen = () => {
      this._reconnect.success();
      actionQueue.exec();
      this.emit(OPEN);
    };
    const onError = (err: Error) => {
      if (im.status === 'online') {
        this.emit(ERROR);
        this._reconnect.fail('ONERROR', err);
      }
    };
    const onClose = (err: Error) => {
      if (im.status === 'online') {
        this.emit(CLOSE, err);
        this._reconnect.fail('ONCLOSE', err);
      }
    };


    /**
     * 消息包格式：https://yuque.antfin-inc.com/alime/nsgl9g/bshnwg
     * @param {*} data
     */
    const onMessage = (data: any) => {
			// debugger;
			console.log('onMessage-----',data);
			const packetTypeId = data[0]
			switch(packetTypeId){
				/**
					* IM 主动下行，表示当前连接已建立成功
				*/
				case '1':{
					this.emit(CONNECT);
					// 建联成功发ping
					this._send('3');
					break;
				}

				/**
					* IM主动下行的连接断开消息，如IM的会话超时断开，连接踢除，心跳超时断开等
				*/
				case '2':{
					const { reason } = getMsgBody(2, data);
					this.emit(CLOSE, reason);
					// 心跳超时，服务端重启，单元切流，立即重连
					if (
						[
							'HEARTBEAT_TIMEOUT',
							'SERVER_CONNECTION_CLOSED',
							'UNIT_SWITCH',
						].includes(reason)
					) {
						this._reconnect.exec(reason);
					}
					/**
					 * 发了这三个消息后会再重复收到socket close消息
					 * 导致业务端重复断线重连的逻辑
					 * 所以先将这几个消息移除
					 */
					if (
						[
							'CONNECTION_KICK_OUT',
							'CONNECTION_TIMEOUT',
							'HEARTBEAT_TIMEOUT',
							'UNIT_SWITCH',
						].includes(reason)
					) {
						im.off(MESSAGE, onMessage);
						im.off(OPEN, onOpen);
						im.off(ERROR, onError);
						im.off(CLOSE, onClose);
						// 断开IM，断开连接
						this.close();
					}
					break;
				}

				/**
				 * pong消息，业务无需更新，只用于保持心跳逻辑
				 */
				case '4':{
					this._preMessageTime = new Date().getTime();
					break;
				}

				/**
				 * 业务消息
				 */
				case '5':{
					const msg = getMsgBody(5, data);
					const messageId = msg.messageId;
					// 重复的消息
					if (msgQueue.exist(messageId)) {
						return;
					}
					this.emit(MESSAGE, msg);
					// this._ack(messageId); // 不需要返回ack @景奕
					msgQueue.push(messageId);
					this.onMessageCallback(msg);
					this._preMessageTime = new Date().getTime();
					break;
				}

				/**
				 * ack消息
				 */
				case '6':{
					this.emit(ACK, getMsgBody(6, data));
					break;
				}
				
				/**
				 * event消息
				 */
				case '7':{
					this.emit(EVENT, getMsgBody(7, data));
					break;
				}

				default:{
					console.log('未知消息',data);
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

// // this.socket.onmessage = (event) => {
// // 	onMessageCallback(event); // 交由用户自行处理
// // }
// // this.socket.onerror = (e) => {
// // 	throw(e); // CHECK
// // }

// @ts-ignore
window.AvatarIM = AvatarIM; // 注册到window方便调试