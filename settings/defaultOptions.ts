export const startDefaultOptions = {
	dialogMode: "aliYunChat", // 对话模式：open:开放域对话 , aliYunChat 云小蜜对话，默认aliYunChat
	duplexMode: "cloud", // 双工模式：cloud:全云模式（默认），client:全客户端模式，blend：混合模式（端云模式）
	outputMode: "video", // 输出模式：video:视频(全云的视频输出需要先startWork去启动pod)，默认 ,audio:音频
	videoOpen: "0", // 是否视频开启 0：未开启，默认 1：开启
	format: "pcm", // 音频格式，可不传，不传默认 pcm
	sampleRate: "16000", // 音频采样率，可不传，不传默认 16K
	emotion: "", // 情感标签 可选，为了可以指定发音人情感
	voice: "zhizhe_emo", // 发音人名称 可选，为了能指定发音人
	characterCode : "CH_I6EenVkg9I4eXnJo", // 人物code
	extInfo : "" // 扩展信息，json格式，暂时未使用，为后续新增参数预览
}

export const wsDefaultOptions = {
	receiverId: "ability",
	receiverType: "server",
	sticky: true
}

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