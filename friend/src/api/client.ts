import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  SearchResponse,
  HistoryResponse,
  PendingResponse,
  SuggestionsResponse,
  FriendsResponse,
  MutualFriendsResponse,
  ConversationsResponse,
  MessagesResponse,
  UnreadResponse,
  ProfileResponse,
  FriendRequestSent,
  ApiError,
} from "../types";

const BASE = "http://localhost:5000/api";

async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T>{
    const token = localStorage.getItem("fs_token");

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    }
 if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
 
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
 
  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
 
  return data as T;
}

const get  = <T>(path: string)=> request<T>(path, { method: "GET" });
const post = <T>(path: string, body?: unknown)  => request<T>(path, { method: "POST",  body: JSON.stringify(body) });
const patch = <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) });

//auth
export const authApi = {
  login:    (payload: LoginPayload)    => post<AuthResponse>("/auth/login",    payload),
  register: (payload: RegisterPayload) => post<AuthResponse>("/auth/register", payload),
  me:       ()                         => get<AuthResponse>("/auth/me"),
};


// search
export const searchApi = {
  autocomplete: (q: string) =>
    get<SearchResponse>(`/search/autocomplete?q=${encodeURIComponent(q)}`),
 
  getHistory: () =>
    get<HistoryResponse>("/search/history"),
 
  undoSearch: () =>
    post<{ removed: string | null }>("/search/history/undo"),
};

// users
export const usersApi = {
  getProfile: (userId: string) =>
    get<ProfileResponse>(`/users/${userId}`),
 
  getFriends: (userId: string) =>
    get<FriendsResponse>(`/users/${userId}/friends`),
 
  updateBio: (bio: string) =>
    patch<{ ok: boolean }>("/users/me/bio", { bio }),
};

// friends

export const friendsApi = {
  sendRequest: (toUser: string) =>
    post<{ message: string; request: FriendRequestSent }>("/friends/request", { to_user: toUser }),
 
  acceptRequest: (fromUser: string) =>
    post<{ message: string }>("/friends/accept", { from_user: fromUser }),
 
  rejectRequest: (fromUser: string) =>
    post<{ message: string }>("/friends/reject", { from_user: fromUser }),
 
  getPending: () =>
    get<PendingResponse>("/friends/pending"),
 
  getSuggestions: () =>
    get<SuggestionsResponse>("/friends/suggestions"),
 
  getMutual: (otherUserId: string) =>
    get<MutualFriendsResponse>(`/friends/mutual/${otherUserId}`),
 
  unfriend: (userId: string) =>
    post<{ message: string }>("/friends/unfriend", { user_id: userId }),
};


// chat
export const chatApi = {
  sendMessage: (receiverId: string, content: string) =>
    post<{ message: import("../types").Message }>("/chat/send", { receiver_id: receiverId, content }),
 
  getConversation: (otherUserId: string, limit = 50) =>
    get<MessagesResponse>(`/chat/${otherUserId}?limit=${limit}`),
 
  pollMessages: (otherUserId: string, since: string) =>
    get<MessagesResponse>(`/chat/poll/${otherUserId}?since=${encodeURIComponent(since)}`),
 
  getConversations: () =>
    get<ConversationsResponse>("/chat/conversations"),
 
  getTotalUnread: () =>
    get<UnreadResponse>("/chat/unread"),
};
