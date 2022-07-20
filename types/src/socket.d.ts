export default class Socket {
    ws: WebSocket;
    status: string;
    emit: any;
    constructor(url: string);
    get readyState(): number;
    send(data: any): void;
    close(): void;
    private _bindEvts;
}
