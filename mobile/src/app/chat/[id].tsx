import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { fetchMessages } from '../../services/api';
import { getSocket, sendMessageViaSocket } from '../../services/socket';
import { ChatMessage } from '../../types';

export default function ChatScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { userProfile } = useAuth();
  const navigation = useNavigation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Set navigation header title to target user's name
  useEffect(() => {
    if (name) {
      navigation.setOptions({ title: name });
    }
  }, [name, navigation]);

  // Load chat history from backend
  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const loadChatHistory = async () => {
      try {
        const history = await fetchMessages(id);
        if (isMounted) {
          setMessages(history);
        }
      } catch (err) {
        console.error('[ChatScreen] Error loading messages:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChatHistory();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Subscribe to real-time socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleReceiveMessage = (newMessage: ChatMessage) => {
      // Check if message belongs to this conversation (between current user and target user `id`)
      const isCurrentConversation =
        (newMessage.senderId === userProfile?._id && newMessage.receiverId === id) ||
        (newMessage.senderId === id && newMessage.receiverId === userProfile?._id) ||
        (newMessage.senderId === userProfile?.firebaseUid && newMessage.receiverId === id) ||
        (newMessage.senderId === id && newMessage.receiverId === userProfile?.firebaseUid);

      if (isCurrentConversation) {
        setMessages((prev) => {
          // Avoid duplicate messages
          if (prev.some((m) => m._id === newMessage._id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [id, userProfile]);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text || !id || sending) return;

    setSending(true);

    sendMessageViaSocket(id, text, (response) => {
      setSending(false);
      if (response.success && response.message) {
        const sentMsg = response.message;
        setMessages((prev) => {
          if (prev.some((m) => m._id === sentMsg._id)) return prev;
          return [...prev, sentMsg];
        });
        setInputText('');
      } else if (response.error) {
        console.error('[Send Message Error]:', response.error);
      }
    });
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isMyMessage =
      item.senderId === userProfile?._id || item.senderId === userProfile?.firebaseUid;

    return (
      <View
        style={[
          styles.messageBubbleContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}>
        <View style={[styles.bubble, isMyMessage ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.timeText, isMyMessage ? styles.myTimeText : styles.otherTimeText]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet.</Text>
              <Text style={styles.emptySubtext}>Say hi to start the conversation!</Text>
            </View>
          }
        />

        {/* Message Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#8E8E93"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}>
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6C6C70',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  messageBubbleContainer: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  myBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#1C1C1E',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimeText: {
    color: '#8E8E93',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    fontSize: 16,
    color: '#1C1C1E',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#B0D3FF',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C6C70',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
});
