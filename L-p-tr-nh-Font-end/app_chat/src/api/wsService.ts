const WS_URL = "wss://chat.longapp.site/chat/chat";

class WebSocketService {
    private static instance: WebSocketService;
    private ws: WebSocket | null = null;
    private pendingRequests: Map<string, { resolve: (data: any) => void; reject: (e: Error) => void; timeout: NodeJS.Timeout }> = new Map();
    private onConnectCallbacks: Array<() => Promise<void>> = [];

    private constructor() {}

    static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    ensureConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }

            if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
                const checkReady = setInterval(() => {
                    if (this.ws?.readyState === WebSocket.OPEN) {
                        clearInterval(checkReady);
                        resolve();
                    }
                }, 100);
                setTimeout(() => {
                    clearInterval(checkReady);
                    reject(new Error("Connection timeout"));
                }, 15000);
                return;
            }

            this.ws = new WebSocket(WS_URL);

            this.ws.onopen = async () => {
                console.log("[WebSocketService] Connected");
                
                // Thêm delay nhỏ để socket fully ready
                await new Promise(r => setTimeout(r, 100));

                // Gọi tất cả các hàm callback onConnect đã đăng ký
                for (const callback of this.onConnectCallbacks) {
                    try {
                        console.log("[WebSocketService] Running onConnect callback");
                        await callback();
                        // Trì hoãn giữa các lần gọi lại để tránh tình trạng tranh đua
                        await new Promise(r => setTimeout(r, 200));
                    } catch (e) {
                        console.warn("[WebSocketService] onConnect callback failed:", e);
                    }
                }
                
                resolve();
            };

            this.ws.onmessage = (ev: MessageEvent) => {
                try {
                    const data = JSON.parse(ev.data);
                    console.log("[WS] Response:", data.event, "status:", data.status);
                    
                    const eventKey = data.event;

                    // Xử lý lỗi xác thực - từ chối tất cả các yêu cầu đang chờ xử lý
                    if (eventKey === "AUTH" && data.status === "error") {
                        console.warn("[WS] AUTH error:", data.mes);
                        this.pendingRequests.forEach((req) => {
                            clearTimeout(req.timeout);
                            req.reject(new Error(data.mes || "User not Login"));
                        });
                        this.pendingRequests.clear();
                        return;
                    }

                    // So khớp phản hồi theo tên sự kiện
                    if (eventKey && this.pendingRequests.has(eventKey)) {
                        const req = this.pendingRequests.get(eventKey)!;
                        clearTimeout(req.timeout);
                        this.pendingRequests.delete(eventKey);
                        
                        if (data.status === "error") {
                            req.reject(new Error(data.mes || `${eventKey} failed`));
                        } else {
                            req.resolve(data);
                        }
                    }
                } catch (e) {
                    console.error("[WS] Parse error:", e);
                }
            };

            this.ws.onerror = (e) => {
                console.error("[WS] Error:", e);
                reject(new Error("WebSocket connection failed"));
            };

            this.ws.onclose = () => {
                console.log("[WS] Closed");
                this.ws = null;
                this.pendingRequests.forEach(req => {
                    clearTimeout(req.timeout);
                    req.reject(new Error("WebSocket closed"));
                });
                this.pendingRequests.clear();
            };
        });
    }

    async request<T = any>(payload: any, eventKey?: string): Promise<T> {
        await this.ensureConnection();

        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket not open");
        }

        const event = eventKey || payload.data?.event;
        if (!event) {
            throw new Error("Event name missing in payload");
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(event);
                console.warn(`[WS] Timeout for ${event} after 60s`);
                reject(new Error("Request timeout"));
            }, 120000); // Tăng từ 30s lên 60s

            this.pendingRequests.set(event, { resolve, reject, timeout });
            
            try {
                console.log(`[WS] Sending ${event}`);
                this.ws!.send(JSON.stringify(payload));
            } catch (e) {
                this.pendingRequests.delete(event);
                clearTimeout(timeout);
                reject(e);
            }
        });
    }

    // Đăng ký hàm gọi lại để thực thi khi kết nối WebSocket được thiết lập
    addOnConnectCallback(callback: () => Promise<void>) {
        this.onConnectCallbacks.push(callback);
    }

    close() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export default WebSocketService.getInstance();
