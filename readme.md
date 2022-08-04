# 0.0.5 更新
start改为startSession
stop改为stopSession
sendText需要在sessionReady之后
format不再随着base64发出

# 0.1.1 更新
AvatarChatIM仍然为默认输出
提供BaseIM为纯净IM
引入方式：
import AvatarIM, { BaseIM } from '@alife/avatar-im-sdk'