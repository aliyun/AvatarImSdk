## alibaba AvatarImSdk
avatar-im-sdk是一个web端与云渲染数字人交互的工具，提供了上行通信的能力。

## 安装
```javascript
npm install alife-avatar-im-sdk
```

## 使用示例
注意：第三步中，对话行为需要等待sessionReady回调后才可以传输数据，否则js会抛出一个错误，因此当session未建立时发送数据到后端可能会出现数据丢失
```javascript
import AvatarIM from '@alife/avatar-im-sdk'
// 1.调用startWork接口从服务端获取token等参数
// ...

// 2.创建实例，sdk会自动执行client.connect方法，无需重复调用
const client = new AvatarIM({
  token:'xxxxxx',
  appId:'virtual-human-lab',
  tenantId:'20000',
  sessionId: "xxxxxxxxxxxxxx",
  onMessageCallback:(data) => {
    console.log('onMessageCallback-------',data)；
  }
})

// 3.会话开始
client.startSession({
  format: "wav"
});

// 4.等待sessionReady回调
client.sessionReady.then(()=>{
  
  // 5. 数据传输
  client.sendAudio({ // 发送音频
    base64 // base64字符串
  });
  client.sendText('文本')； // 发送文字
  
});

// 6.关闭ws连接
client.closeSession();
```
## API列表
### constructor(options)
> 创建AvatarIM实例，建立ws连接

使用示例
```javascript
const client = new AvatarIM(options);
```
options入参

| Name | Description | 是否必选 | Schema |
| --- | --- | --- | --- |
| url | 默认wss://pre-avatar-im.console.aliyun.com/ws | 否 | string |
| token |  | 是 | string |
| appId |  | 是 | string |
| tenantId |  | 是 | string |
| sessionId | 会话id，视频输出时为startWork启动pod时返回的sessionId | 是 | string |
| onMessageCallback | 处理返回消息的回调函数 | 否 | Function |


---

### connect()
> 主动建立ws连接(调用constructor时会自动调用，手动connect可用于close后手动重新连接)

使用示例
```javascript
client.connect();
```

---

### close()
> 手动关闭ws连接

使用示例
```javascript
client.close();
```

---

### startSession(options)
> 开始会话，并返回随机生成的messageId

使用示例
```javascript
const messageId = client.startSession({
  format: "wav"
})；
console.log(messageId); // 查看随机生成的messageId
```
options入参

| Name | Description | 是否必选 | Schema |
| --- | --- | --- | --- |
| format | 音频格式，可不传，不传默认 pcm | 否 | string |
| sampleRate | 音频采样率，可不传，不传默认 16K | 否 | string |
---

### stopSession(options)
> 结束会话，并返回随机生成的messageId

使用示例
```javascript
const messageId = client.stopSession();
console.log(messageId); // 查看随机生成的messageId
```

---

### sendText(text)
> 发送文字，并返回随机生成的messageId

使用示例
```javascript
client.sessionReady().then(() => {
  const messageId = client.sendText('你好呀');
  console.log(messageId); // 查看随机生成的messageId
});
```
入参

| Name | Description | 是否必选 | Schema |
| --- | --- | --- | --- |
| text | 发送的文本 | 是 | string |


---

### sendAudio({base64})
> 发送音频，并返回随机生成的messageId

使用示例
```javascript
client.sessionReady().then(() => {
  const messageId = client.sendAudio({
    base64: 'xxxxxxxxx'
  });
  console.log(messageId); // 查看随机生成的messageId
});
```
入参

| Name | Description | 是否必选 | Schema |
| --- | --- | --- | --- |
| base64 | 音频数据 | 是 | string |


---

### send(data)
> 发送已包装好的纯字符串信息，完全自定义

使用示例
```javascript
client.send('5{"messageId":"xxx","receiverAppId":"xxxx","content":"{}"}') // 发送数据
client.send('3') // 心跳检测
```
入参

| Name | Description | 是否必选 | Schema |
| --- | --- | --- | --- |
| data | 包装好的纯字符串信息 | 是 | string |


---

### sendMessage(msg)
> 按照固定的消息格式给传入的msg补充必要信息，发送5开头的消息，返回随机生成的messageId

使用示例
```javascript
const messageId = client.sendMessage({text:"xxx",audio:"xxx"})
console.log(messageId); // 查看随机生成的messageId
// 实际发送的信息为：
5{
  "content":{  // 传入的content参数
    "text":"xxx",
    "audio":"xxx"
  },
  "messageId": "xxxx", // 随机生成的messageId
  "receiverAppId": "xxxx", // constructor里传入的appId
  "receiverId": "ability", // 默认值
  "receiverType": "server", // 默认值
  "sticky": true // 默认值
}
```
入参

| Name | Description | 是否必选 | Schema |
| --- | --- | --- | --- |
| content | 要传的信息 | 是 | object |


---


