export interface PublicUser {
  id: number;
  first_name: string;
  last_name: string;
  institutional_email: string;
  university_name: string;
  is_verified: boolean;
}

export interface ProfileFull {
  user: PublicUser;
  career: string;
  semester: string;
  bio: string;
  teach: string[];
  learn: string[];
}

export interface MatchView {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    university_name: string;
    career: string;
  };
  teach: string[];
  learn: string[];
  youCanTeachThem: string[];
  theyCanTeachYou: string[];
  compatibility: number;
  bidirectional: boolean;
}

export interface ConversationView {
  id: number;
  other: {
    id: number;
    first_name: string;
    last_name: string;
    university_name: string;
    career: string;
  };
  lastMessage: string | null;
}

export interface MessageView {
  id: number;
  sender_id: number;
  sender_name: string;
  body: string;
  created_at: string;
}
