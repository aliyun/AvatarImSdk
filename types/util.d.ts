/**
 * 处理后端传来的字符串中，json前有一个数字(code)的情况
 */
export declare function getMsgBody(code: number, msg: string): any;
export declare function makeMsgBody(code: number, msg: object): string;
/**
 * 生成sessionId的方法
 *
 */
export declare function generateRandomId(): string;
/**
 * 拼接完整url
 */
export function getFullUrl(url:string, token:string, appKey:string, tenant:string): string;
