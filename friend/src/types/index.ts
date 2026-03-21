// user 

export interface User{
  id: string;
  username:string;
  display_name: string;
  email?: string;
  bio: string;
  avatar_url: string;
  created_at: string;
  friend_count?: number;
}

export interface SearchUser extends User{
    mutual_friends: number;
    is_friend: boolean;
    request_pending: boolean;

}
export interface SuggestedUser extends User {
  mutual_friends: number;
}

// auth

export interface AuthResponse {
  user: User;
  token: string;
}
 
export interface LoginPayload {
  username: string;
  password: string;
}
 
export interface RegisterPayload {
  username: string;
  display_name: string;
  email: string;
  password: string;
  bio?: string;
}

// friends

export interface FriendRequest {
  from_user: string;
  sender_name: string;
  sender_username: string;
  timestamp: string;
}
 
export interface FriendRequestSent {
  from_user: string;
  to_user: string;
  timestamp: string;
  status: "pending" | "accepted" | "rejected";
}
 


// chat

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  read: boolean;
}
 
export interface Conversation {
  other_user_id: string;
  other_display_name: string;
  other_username: string;
  last_message: string;
  last_timestamp: string;
  unread_count: number;
  last_sender_is_me: boolean;
}

// response

export interface ApiError {
  error: string;
}
 
export interface SearchResponse {
  results: SearchUser[];
  query: string;
}
 
export interface HistoryResponse {
  history: string[];
}
 
export interface PendingResponse {
  pending: FriendRequest[];
}
 
export interface SuggestionsResponse {
  suggestions: SuggestedUser[];
}
 
export interface FriendsResponse {
  friends: User[];
}
 
export interface MutualFriendsResponse {
  mutual_friends: User[];
}
 
export interface ConversationsResponse {
  conversations: Conversation[];
}
 
export interface MessagesResponse {
  messages: Message[];
  count: number;
}
 
export interface UnreadResponse {
  unread: number;
}
 
export interface ProfileResponse {
  user: User;
}


// ui helper

export type SidebarTab = "search" | "requests" | "suggestions";

export type AppPage = "login" | "search" | "profile" | "chat";