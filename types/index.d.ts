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

type AvatarIMInput = {
	url: string; // wss url
	token: string;
	appKey: string;
	tenant: string;
	sessionId: string;
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

  constructor({url,token, appKey, tenant, sessionId, onMessageCallback}:AvatarIMInput):void;

  public connect():void;
  public close():void;
  public start(startOptions:StartOptions):void;
  public stop():void;
  public refreshContext(options:any):void
  public sendText(text:string,duplexCommand={}):void;
  public sendAudio({
    format,
    base64,
  }):void;
  public broadcastStatus(sentenceId:string,status:string):void;
  private getReadyState(): number
  private _send(data: string): void
  private sendMessage(content: object): void
  private ping(): void
  private _pong(): any
  private reconnect(code: string): void
  private _mockHeartbeatTimeout(): void
  private _keepAlive(): number
  private _ack(messageId: string): void
  private _clearInterval(): void
  private _bindEvt(im: any): void
}