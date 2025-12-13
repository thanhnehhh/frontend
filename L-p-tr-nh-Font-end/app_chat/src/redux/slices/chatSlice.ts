import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUserList, getPeopleChatMes, sendMessage } from "../../api/chatApi";

interface ChatUser {
    name: string;
    type: number;
    actionTime: string;
}

interface ChatState {
    currentRoom: string | null;
    currentPerson: string | null;
    messages: any[];
    userList: ChatUser[];
    isLoading: boolean;
    isSending: boolean;
    error: string | null;
}

const initialState: ChatState = {
    currentRoom: null,
    currentPerson: null,
    messages: [],
    userList: [],
    isLoading: false,
    isSending: false,
    error: null,
};

export const fetchUserList = createAsyncThunk(
    "chat/fetchUserList",
    async (_, { rejectWithValue, dispatch }) => {
        try {
            const resp: any = await getUserList();
            if (resp.status === "success") {
                const personChats = (resp.data || []).filter((u: any) => u.type === 0);
                return personChats;
            }
            return rejectWithValue(resp.mes || "Lấy danh sách thất bại");
        } catch (e: any) {
            const errorMsg = e.message || "Lỗi kết nối";
            // Nếu auth error, clear localStorage và logout
            if (errorMsg.includes("User not Login") || errorMsg.includes("AUTH")) {
                localStorage.removeItem("reLoginCode");
                localStorage.removeItem("username");
                // Dispatch logout action sẽ được xử lý ở listener
            }
            return rejectWithValue(errorMsg);
        }
    }
);

export const fetchPeopleMessages = createAsyncThunk(
    "chat/fetchPeopleMessages",
    async ({ name, page = 1 }: { name: string; page?: number }, { rejectWithValue }) => {
        try {
            const resp: any = await getPeopleChatMes(name, page);
            if (resp.status === "success") {
                return { name, messages: resp.data || [] };
            }
            return rejectWithValue(resp.mes || resp.data || "Lấy tin nhắn thất bại");
        } catch (e: any) {
            return rejectWithValue(e.message || "Lỗi kết nối");
        }
    }
);

export const sendChatMessage = createAsyncThunk(
    "chat/sendChatMessage",
    async ({ type, to, mes }: { type: "people" | "room"; to: string; mes: string }, { rejectWithValue, getState }) => {
        try {
            const state: any = getState();
            const username = state.auth.username;
            
            const resp: any = await sendMessage(type, to, mes);
            if (resp.status === "success" || !resp.status) {
                // Server may not return explicit success for SEND_CHAT
                return {
                    id: Date.now(),
                    name: username,
                    type: type === "room" ? 1 : 0,
                    to,
                    mes,
                    createAt: new Date().toLocaleString(),
                };
            }
            return rejectWithValue(resp.mes || "Gửi tin nhắn thất bại");
        } catch (e: any) {
            return rejectWithValue(e.message || "Lỗi kết nối");
        }
    }
);

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        setCurrentRoom: (state, action) => {
            state.currentRoom = action.payload;
        },
        setCurrentPerson: (state, action) => {
            state.currentPerson = action.payload;
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        clearMessages: (state) => {
            state.messages = [];
        },
    },
    extraReducers: (builder) => {
        // Fetch user list
        builder
            .addCase(fetchUserList.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUserList.fulfilled, (state, action) => {
                state.isLoading = false;
                state.userList = action.payload;
            })
            .addCase(fetchUserList.rejected, (state, action) => {
                state.isLoading = false;
                const errorMsg = String(action.payload) || "Lỗi khi tải danh sách";
                state.error = errorMsg;
                // Auth error will trigger logout in App.tsx by watching auth state
            });

        // Fetch messages
        builder
            .addCase(fetchPeopleMessages.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchPeopleMessages.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentPerson = action.payload.name;
                state.messages = action.payload.messages || [];
            })
            .addCase(fetchPeopleMessages.rejected, (state, action) => {
                state.isLoading = false;
                state.error = String(action.payload) || "Lỗi khi tải tin nhắn";
            });

        // Send message
        builder
            .addCase(sendChatMessage.pending, (state) => {
                state.isSending = true;
                state.error = null;
            })
            .addCase(sendChatMessage.fulfilled, (state, action) => {
                state.isSending = false;
                state.messages.push(action.payload);
            })
            .addCase(sendChatMessage.rejected, (state, action) => {
                state.isSending = false;
                state.error = String(action.payload) || "Lỗi khi gửi tin nhắn";
            });
    },
});

export const { setCurrentRoom, setCurrentPerson, addMessage, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
