import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Message = {
  id: string;
  text: string;
  time: string;
  mine: boolean;
};

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    room?: string;
    country?: string;
  }>();

  const room = params.room || 'الغرفة';
  const country = params.country || '';

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = () => {
    const text = message.trim();

    if (!text) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      time: new Date().toLocaleTimeString('ar-IQ', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      mine: true,
    };

    setMessages((current) => [...current, newMessage]);
    setMessage('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.roomTitle}>{room}</Text>
          <Text style={styles.roomSubtitle}>
            {country} • 🟢 متصل
          </Text>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreText}>•••</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>أهلاً بك في الغرفة</Text>
            <Text style={styles.emptyText}>
              ابدأ المحادثة وأرسل أول رسالة.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageRow,
              item.mine && styles.myMessageRow,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                item.mine && styles.myMessageBubble,
              ]}
            >
              <Text style={styles.messageText}>{item.text}</Text>
              <Text style={styles.messageTime}>{item.time}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.inputArea}>
        <TouchableOpacity style={styles.attachButton}>
          <Text style={styles.attachText}>＋</Text>
        </TouchableOpacity>

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="اكتب رسالتك..."
          placeholderTextColor="#71869A"
          style={styles.input}
          multiline
          maxLength={1000}
          textAlign="right"
        />

        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          activeOpacity={0.75}
        >
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
  },
  header: {
    height: 92,
    paddingTop: 40,
    paddingHorizontal: 16,
    backgroundColor: '#0A1725',
    borderBottomWidth: 1,
    borderBottomColor: '#1B2D40',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    color: '#FFFFFF',
    fontSize: 38,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  roomTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  roomSubtitle: {
    color: '#71869A',
    fontSize: 11,
    marginTop: 4,
  },
  moreButton: {
    width: 40,
    alignItems: 'center',
  },
  moreText: {
    color: '#8FA8C2',
    fontSize: 18,
  },
  messages: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  empty: {
    alignItems: 'center',
    marginBottom: 30,
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    color: '#71869A',
    fontSize: 13,
    marginTop: 7,
  },
  messageRow: {
    width: '100%',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  myMessageRow: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '82%',
    backgroundColor: '#0D1B2A',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  myMessageBubble: {
    backgroundColor: '#1769AA',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
  },
  messageTime: {
    color: '#A9C0D5',
    fontSize: 9,
    marginTop: 4,
    textAlign: 'left',
  },
  inputArea: {
    minHeight: 68,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#0A1725',
    borderTopWidth: 1,
    borderTopColor: '#1B2D40',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#122235',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachText: {
    color: '#8FA8C2',
    fontSize: 24,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 21,
    backgroundColor: '#122235',
    color: '#FFFFFF',
    fontSize: 14,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 19,
  },
});
