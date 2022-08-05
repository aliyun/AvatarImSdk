import { BaseIM,IM,IMInput } from '../../index'
import { startDefaultOptions,messageDefaultOptions } from './settings'
import { MESSAGE } from '../../const';

type StartOptions = {
	dialogMode?: "cloud" | "aliYunChat"; // 对话模式：open:开放域对话 , aliYunChat 云小蜜对话，默认aliYunChat
	duplexMode?: "cloud" | "client" | "blend"; // 双工模式：cloud:全云模式（默认），client:全客户端模式，blend：混合模式（端云模式）
	outputMode?: "video" | "audio"; // 输出模式：video:视频(全云的视频输出需要先startWork去启动pod)，默认 ,audio:音频
	videoOpen?: "0" | "1"; // 是否视频开启 0：未开启，默认 1：开启
	format?: string; // 音频格式，可不传，不传默认 pcm
	sampleRate?: string; // 音频采样率，可不传，不传默认 16K
} | {}

type sendAudioParam = {
	base64: string
}

export default class AvatarChatIM extends BaseIM implements IM {
	public sessionReady: Promise<any>;
	private sessionOpen: boolean = false; // 内部判断会话是否开启

	constructor(options:IMInput){
		super(options);
	}

	public sendMessage(content: object): string {
		const params = {
			...messageDefaultOptions,
			receiverAppId: this.appId,
			content
		}
		const messageId = super.sendMessage(params);
		return messageId
	}

	public startSession(options:StartOptions){
		/**会话开始接口 */
		const msg = {
			type:"start",
			sessionId:this.sessionId,
			...startDefaultOptions
		};
		options && Object.keys(options).forEach((key) => { // TODOS
			msg[key] = options![key] || startDefaultOptions[key];
		})

		// 刷新promise
		this.sessionReady = new Promise((resolve,reject)=>{
			this.on(MESSAGE,(msg)=>{
				if(msg.content.type === 'startResult'){
					this.sessionOpen = true;
					resolve(msg);
				}
			})
		})

		const msgId = this.sendMessage(msg);
		return msgId;
	}

	public stopSession(){
		if(!this.sessionOpen){
			throw Error('会话通道尚未开启');
		}
		const msg = {
			type:"stop",
			sessionId:this.sessionId
		};
		const msgId = this.sendMessage(msg);
		this.sessionOpen = false;
		this.sessionReady = new Promise(()=>{}); // 重制sessionReady为空
		return msgId;
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
		const msgId = this.sendMessage(msg);
		return msgId;
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
		const msgId = this.sendMessage(msg);
		return msgId;
	}

	public sendAudio({base64}: sendAudioParam){
		if(!this.sessionOpen){
			throw Error('会话通道尚未开启');
		}
		const msg = {
			type:"dataSend",
			sessionId:this.sessionId,
			audio:base64
			// duplexCommand: duplexCommand||undefined
		};
		const msgId = this.sendMessage(msg);
		return msgId;
	}

	// public broadcastStatus(sentenceId:string,status:string){
	// 	if(!this.sessionOpen){
	// 		throw Error('会话通道尚未开启');
	// 	}
	// 	const msg = {
	// 		type:"broadcastStatus",
	// 		sessionId:this.sessionId,
	// 		sentenceId,
	// 		status
	// 	}
	// }
}