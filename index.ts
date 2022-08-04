import { BaseIM } from './src/index'
import AvatarChatIM from './src/extensions/avatarChat/index'

export { AvatarChatIM, BaseIM, AvatarChatIM as default };// 默认提供AvatarChatIM

if (globalThis.constructor.name === 'Window') {
  //@ts-ignore
  window.AvatarIM = AvatarChatIM; // 注册到window上
  // Object.defineProperty(globalThis,'AvatarIM',AvatarChatIM); 
}
