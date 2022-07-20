/**
 * WebSocket
 * https://html.spec.whatwg.org/multipage/web-sockets.html#network
 */
 import mitt from 'mitt';
 import { OPEN, MESSAGE, ERROR, CLOSE } from './const';
//  import { wsDefaultOptions } from '../settings/defaultOptions'

 export default class Socket {
   ws: WebSocket;
   status: string;
   emit: any;
   constructor(url:string) { // startWorks已经鉴权完毕
    //  console.log(url, '>>>getWsUrl');
     const ws = new WebSocket(url);
    //  console.log(ws, '>>>ws');
     this._bindEvts(ws);  // 绑定emit事件
     Object.assign(this, {
       ws,
       status: 'online',
       ...mitt(),
     });
   }
   get readyState(): number { // getter,返回ws的readyState
     return this.ws.readyState;
   }
   send(data): void { // WebSocket.send();
     this.ws.send(data);
   }
   close(): void { // WebSocket.close();
     this.status = 'offline';
     this.ws.close();
   }
   private _bindEvts(ws): void { // WebSocket.addEventListener();
     ws.addEventListener(OPEN, () => {
       this.emit(OPEN);
     });
     ws.addEventListener(MESSAGE, ev => {
       this.emit(MESSAGE, ev.data);
     });
     ws.addEventListener(ERROR, err => {
       // ws.close();
       this.emit(ERROR, err);
       this.status = 'offline';
     });
     ws.addEventListener(CLOSE, err => {
       this.emit(CLOSE, err);
       this.status = 'offline';
     });
   }
 }
 