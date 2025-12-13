import React, { useState, useEffect } from "react";
import "../styles/chat.css";
import "../styles/app.css";
import ChatItem from "../components/ChatItem";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { fetchUserList, fetchPeopleMessages, clearMessages } from "../redux/slices/chatSlice";
import ChatDetail from "./ChatDetail";

export default function ChatScreen() {
    const dispatch = useAppDispatch();
    const { userList, isLoading } = useAppSelector((s: any) => s.chat);
    const [activeTab, setActiveTab] = useState<"chats" | "groups" | "profile" | "more">("chats");
    const [selectedName, setSelectedName] = useState<string | null>(null);

    useEffect(() => {
        // Chờ 500ms để socket kết nối xong, rồi fetch user list
        const timer = setTimeout(() => {
            console.log("[ChatScreen] Fetching user list");
            dispatch(fetchUserList() as any);
        }, 500);
        
        return () => clearTimeout(timer);
    }, [dispatch]);

    const handleSelectChat = (name: string) => {
        setSelectedName(name);
        dispatch(clearMessages());
        dispatch(fetchPeopleMessages({ name, page: 1 }) as any);
    };
    return (
        <div className="chat-screen">
            <div className="chat-header">
                <div className="chat-header-title">
                    <h1>Chats</h1>
                </div>
                <div className="chat-header-icons">
                    <button className="icon-btn search-btn">🔍</button>
                    <button className="icon-btn plus-btn">➕</button>
                </div>
            </div>

            <div className={`chat-list ${selectedName ? "slide-out" : ""}`}>
                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>Đang tải...</div>
                ) : userList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>Chưa có cuộc chat nào</div>
                ) : (
                    userList.map((user: any) => (
                        <div key={user.name} onClick={() => handleSelectChat(user.name)}>
                            <ChatItem
                                chat={{
                                    id: Math.random(),
                                    name: user.name,
                                    lastMessage: "...",
                                    time: user.actionTime,
                                    unreadCount: 0,
                                }}
                            />
                        </div>
                    ))
                )}
            </div>

            {selectedName && (
                <ChatDetail name={selectedName} onClose={() => setSelectedName(null)} />
            )}

            <div className="chat-footer">
                <button className={`nav-btn ${activeTab === "chats" ? "active" : ""}`} onClick={() => setActiveTab("chats")}>
                    <span className="nav-icon">💬</span>
                    <span className="nav-label">Chats</span>
                </button>
                <button className={`nav-btn ${activeTab === "groups" ? "active" : ""}`} onClick={() => setActiveTab("groups")}>
                    <span className="nav-icon">👥</span>
                    <span className="nav-label">Groups</span>
                </button>
                <button className={`nav-btn ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
                    <span className="nav-icon">👤</span>
                    <span className="nav-label">Profile</span>
                </button>
                <button className={`nav-btn ${activeTab === "more" ? "active" : ""}`} onClick={() => setActiveTab("more")}>
                    <span className="nav-icon">⋮</span>
                    <span className="nav-label">More</span>
                </button>
            </div>
        </div>
    );
}
