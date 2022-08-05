export const messageDefaultOptions = {
	receiverId: "ability",
	receiverType: "server",
	sticky: true
}

export const startDefaultOptions = {
	dialogMode: "aliYunChat", // 对话模式：open:开放域对话 , aliYunChat 云小蜜对话，默认aliYunChat
	duplexMode: "cloud", // 双工模式：cloud:全云模式（默认），client:全客户端模式，blend：混合模式（端云模式）
	outputMode: "video", // 输出模式：video:视频(全云的视频输出需要先startWork去启动pod)，默认 ,audio:音频
	videoOpen: "0", // 是否视频开启 0：未开启，默认 1：开启
	format: "pcm", // 音频格式，可不传，不传默认 pcm
	sampleRate: "16000", // 音频采样率，可不传，不传默认 16K
}