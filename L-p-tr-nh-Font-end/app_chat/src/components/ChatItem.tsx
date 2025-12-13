import React from "react";
import "../styles/chatItem.css";

interface ChatItemProps {
    chat: {
        id: number;
        name: string;
        lastMessage: string;
        time: string;
        unreadCount: number;
    };
}

export default function ChatItem({ chat }: ChatItemProps) {
    return (
        <div className="chat-item">
            <div className="chat-item-avatar">
                <div className="avatar-placeholder">{chat.name.charAt(0)}</div>
            </div>
            <div className="chat-item-content">
                <div className="chat-item-top">
                    <h3 className="chat-item-name">{chat.name}</h3>
                    <span className="chat-item-time">{chat.time}</span>
                </div>
                <div className="chat-item-bottom">
                    <p className="chat-item-message">{chat.lastMessage}</p>
                    {chat.unreadCount > 0 && (
                        <span className="chat-item-badge">{chat.unreadCount}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
