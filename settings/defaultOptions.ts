export const wsDefaultOptions = {
	receiverId: "ability",
	receiverType: "server",
	sticky: true
}

export const wsDefaultUrl = 'wss://avatar-im.console.aliyun.com/ws'
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