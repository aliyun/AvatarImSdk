/**
 * 处理后端传来的字符串中，json前有一个数字(code)的情况
 */

export function getMsgBody(code: number, msg: string): any {
  let res = null;
  try {
    res = JSON.parse(msg.replace(String(code), '')); // 只替换第一个
  } catch (e) {
    console.error(e);
  }
  return res;
}

export function makeMsgBody(code: number, msg: object): string {
  return `${code}${JSON.stringify(msg)}`;
}

/**
 * 生成sessionId的方法
 * 
 */
export function generateRandomId(): string {
  return String(Date.now())+'_'+String(Math.random()).slice(2,5);
}

/**
 * 拼接完整url
 */
export function getFullUrl(url:string, token:string, appId:string, tenantId:string){
  return `${url}?token=${token}&app=${appId}&tenant=${tenantId}`;
 }
