import wsService from "./wsService";

class ChatApiService {
    static async getUserList() {
        const payload = {
            action: "onchat",
            data: { event: "GET_USER_LIST" },
        };
        return wsService.request(payload, "GET_USER_LIST");
    }

    static async getPeopleChatMes(name: string, page = 1) {
        const payload = {
            action: "onchat",
            data: {
                event: "GET_PEOPLE_CHAT_MES",
                data: { name, page },
            },
        };
        return wsService.request(payload, "GET_PEOPLE_CHAT_MES");
    }

    static async sendMessage(type: "people" | "room", to: string, mes: string) {
        const payload = {
            action: "onchat",
            data: {
                event: "SEND_CHAT",
                data: { type, to, mes },
            },
        };
        return wsService.request(payload, "SEND_CHAT");
    }

    static async reLogin(user: string, code: string) {
        const payload = {
            action: "onchat",
            data: {
                event: "RE_LOGIN",
                data: { user, code },
            },
        };
        return wsService.request(payload, "RE_LOGIN");
    }
}

export const getUserList = () => ChatApiService.getUserList();
export const getPeopleChatMes = (name: string, page?: number) => ChatApiService.getPeopleChatMes(name, page);
export const sendMessage = (type: "people" | "room", to: string, mes: string) => ChatApiService.sendMessage(type, to, mes);
export const reLogin = (user: string, code: string) => ChatApiService.reLogin(user, code);
export default ChatApiService;

