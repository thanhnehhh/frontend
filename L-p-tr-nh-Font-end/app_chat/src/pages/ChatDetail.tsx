import React, { useState, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { sendChatMessage, fetchPeopleMessages } from "../redux/slices/chatSlice";
import { getPeopleChatMes } from "../api/chatApi";
import "../styles/chatDetail.css";

interface Props {
    name: string;
    onClose: () => void;
}

export default function ChatDetail({ name, onClose }: Props) {
    const dispatch = useAppDispatch();
    const { messages, isLoading, isSending, error } = useAppSelector((s: any) => s.chat);
    const [inputValue, setInputValue] = useState("");
    const { username } = useAppSelector((s: any) => s.auth);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastFetchRef = useRef<number>(0);
    const lastMessageIdRef = useRef<number | null>(null); // Track last message ID

    // Fetch messages khi name thay đổi
    useEffect(() => {
        if (name) {
            console.log("[ChatDetail] Fetching messages for:", name);
            lastMessageIdRef.current = null; // Reset khi đổi chat
            
            // Fetch initial messages
            const initialTimer = setTimeout(() => {
                lastFetchRef.current = Date.now();
                dispatch(fetchPeopleMessages({ name, page: 1 }) as any);
            }, 300);

            // Poll messages mỗi 3 giây, nhưng chỉ fetch nếu khoảng cách >= 2.5 giây
            const pollInterval = setInterval(async () => {
                const now = Date.now();
                if (now - lastFetchRef.current >= 2500) {
                    lastFetchRef.current = now;
                    
                    // Fetch tin nhắn mới từ API
                    try {
                        const resp: any = await getPeopleChatMes(name, 1);
                        
                        if (resp.status === "success") {
                            const newMessages = resp.data || [];
                            
                            // So sánh: chỉ check ID tin nhắn cuối
                            const lastNewId = newMessages.length > 0 ? newMessages[newMessages.length - 1].id : null;
                            
                            // Nếu ID khác → có tin nhắn mới
                            if (lastNewId !== lastMessageIdRef.current) {
                                console.log("[ChatDetail] New messages detected, updating... (ID changed)");
                                lastMessageIdRef.current = lastNewId;
                                dispatch(fetchPeopleMessages({ name, page: 1 }) as any);
                            }
                        }
                    } catch (e) {
                        console.warn("[ChatDetail] Poll check failed:", e);
                    }
                }
            }, 3000);

            return () => {
                clearTimeout(initialTimer);
                clearInterval(pollInterval);
            };
        }
    }, [name, dispatch]);

    // Auto scroll to bottom khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]); // Chỉ scroll khi số lượng messages thay đổi

    const handleSend = async () => {
        if (inputValue.trim() && !isSending) {
            const msg = inputValue.trim();
            setInputValue("");
            
            await dispatch(sendChatMessage({
                type: "people",
                to: name,
                mes: msg
            }) as any);
            
            // Polling sẽ auto refetch sau 1 giây, không cần delay thêm
        }
    };

    const sortedMessages = [...messages].sort((a, b) => {
        if (!a.createAt || !b.createAt) return 0;
        return new Date(a.createAt).getTime() - new Date(b.createAt).getTime();
    });

    return (
        <div className="chat-detail">
            {/* Header Line 1: Back, Title, Menu */}
            <div className="chat-detail-header">
                <div>
                    <button className="back-btn" onClick={onClose}>←</button>
                    <div className="header-title">
                        <h3>Message</h3>
                    </div>
                    <button className="header-menu-btn">⋯</button>
                </div>

                {/* Header Line 2: Avatar, Name, Icons */}
                <div className="header-user-info">
                    <div className="header-avatar">{name.charAt(0)}</div>
                    <div>
                        <h3>{name}</h3>
                        <p className="header-subtitle">+44 50 9285 3022</p>
                    </div>
                    <div className="header-icons">
                        <button className="icon-video" title="Video call">📹</button>
                        <button className="icon-call" title="Phone call">☎️</button>
                    </div>
                </div>
            </div>

            {/* Body: Messages */}
            <div className="chat-detail-body">
                {isLoading && <div className="loading">Đang tải tin nhắn...</div>}
                {!isLoading && messages.length === 0 && (
                    <div className="empty">Bắt đầu cuộc trò chuyện</div>
                )}
                {error && <div className="error-msg">{error}</div>}
                {!isLoading && sortedMessages.map((m: any) => (
                    <div key={m.id} className={`msg ${m.name === username ? "sent" : "received"}`}>
                        <div className="msg-bubble">
                            <p>{m.mes}</p>
                            <span className="msg-time">
                                {m.createAt ? new Date(m.createAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Footer: Input + Send */}
            <div className="chat-detail-footer">
                <button className="btn-plus">➕</button>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    className="msg-input"
                    disabled={isSending}
                />
                <button className="btn-send" onClick={handleSend} disabled={isSending}>
                    {isSending ? "⏳" : "✈️"}
                </button>
            </div>
        </div>
    );
}
