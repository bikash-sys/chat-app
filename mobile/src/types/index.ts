export interface UserProfile {
  _id: string;
  firebaseUid: string;
  phone: string;
  name: string;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
}
