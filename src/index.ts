import mitt,{Emitter} from 'mitt';

import { wsDefaultOptions,wsDefaultUrl } from '../settings/defaultOptions'
import { KEEPALIVE_INTERVAL } from '../settings/params'
import { OPEN, MESSAGE, ACK, ERROR, CLOSE, CONNECT, EVENT } from './const';
import Socket from './socket';
import actionQueue from './actionqueue';
import MsgQueue from './msgqueue';
import getReconnect, {Reconnect} from './reconnect';
import { getMsgBody, makeMsgBody, generateRandomId, getFullUrl } from './util';
interface IM {
	connect():void;
	close():void;
	send(data:string):void;
	sendMessage(content:object):string;
}

type IMInput = {
	url?: string; // wss url
	token: string;
	appKey: string;
	tenant: string;
	sessionId: string;
	// startOptions?: StartOptions; // 会话开始参数，不传全部取默认值
	onMessageCallback?: (msg:any) => any // 处理消息的回调
	onACKErrorCallback?: (err:string) => any // 处理后端返回ack消息失败的回调
}
class BaseIM implements IM {
	public url: string; // 含鉴权信息等的完整url
	public appKey: string;
	public sessionId : string; // sessionId
	// public startOptions?: StartOptions // 用户输入options，不传全部取默认值
	public onMessageCallback?: (msg:any) => any | undefined// 处理消息的回调
	public onACKErrorCallback?: (err:string) => any | undefined// 
	public emit: Emitter["emit"]; // from mitt
  public on: Emitter["on"]; // from mitt

	protected _reconnect: Reconnect;
	protected _preMessageTime: number;
  protected _pingInterval: any;
  protected _pongInterval: any;
	protected im: Socket; // Socket实例

	protected sendMsgQueue: MsgQueue;
	protected receiveMsgQueue: MsgQueue;

	constructor({url,token, appKey, tenant, sessionId, onMessageCallback, onACKErrorCallback}:IMInput){
		url = url || wsDefaultUrl;
		const fullUrl = getFullUrl(url,token, appKey, tenant);
		Object.assign(this,{ // 用户输入注册到this
			sessionId,
			url:fullUrl,
			appKey,
			onMessageCallback,
			onACKErrorCallback,
			...mitt()
		});
		
		this.sendMsgQueue = new MsgQueue();
		this.receiveMsgQueue = new MsgQueue();
    this._reconnect = getReconnect(this);
		this.connect(); // 初始化时建立连接
	}

	public connect(){
		console.log('-----IM connect')
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

	/**
   * 发送消息
   * @param {Object} data
   */
	public send(data: string): void {
		this.im.send(data);
	}

	/**
   * 发送包装好的message
   */
	public sendMessage(content: object): string {
		const messageId = `msg_${generateRandomId()}`
		const params = {
			messageId,
			...wsDefaultOptions,
			receiverAppId: this.appKey,
			content
		}
		if (this.getReadyState() === 1) {
			// 加上协议码
			const msg = makeMsgBody(5, params);
			this.send(msg);
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
		return messageId
	}

	/**
   * 参考 ws.readyState
   * CONNECTING：值为0，表示正在连接。
   * OPEN：值为1，表示连接成功，可以通信了。
   * CLOSING：值为2，表示连接正在关闭。
   * CLOSED：值为3，表示连接已经关闭，或者打开连接失败。
   */
	protected getReadyState(): number {
    const { im } = this;
    return typeof im.readyState === 'number' ? im.readyState : 3;
  }

  /**
   * 发送ping消息
   */
	protected ping(): void {
    this.send('3');
  }

	protected _pong(): any {
    return setInterval(() => {
      if (
        new Date().getTime() - this._preMessageTime >
        KEEPALIVE_INTERVAL * 2 + 100
      ) {
				console.log('pong超时')
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
	protected _keepAlive(): number {
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
  protected _clearInterval(): void {
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
		this.on(ACK, (msg)=>{
			if(msg?.error){
				this.onACKErrorCallback(msg.error); // 传递错误
			}
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
			// console.log('onMessage-----',data);
			const packetTypeId = data[0]
			switch(packetTypeId){
				/**
					* IM 主动下行，表示当前连接已建立成功
				*/
				case '1':{
					this.emit(CONNECT);
					// 建联成功发ping
					this.send('3');
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
						console.log('---服务端主动断开-----')
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
					if (this.receiveMsgQueue.exist(messageId)) {
						return;
					}
					this.emit(MESSAGE, msg);
					// this._ack(messageId); // 不需要返回ack @景奕
					this.receiveMsgQueue.push(messageId);
					this.onMessageCallback?.(msg);
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

export { BaseIM,IM,IMInput }