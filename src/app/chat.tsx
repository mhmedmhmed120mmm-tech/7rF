import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
} from 'react-native';
import { supabase } from '@/lib/supabase';

type Message = {
  id: string;
  username: string;
  icon: string;
  text: string;
  time: string;
  mine: boolean;
};

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    room?: string;
    country?: string;
    username?: string;
    icon?: string;
    loginType?: string;
  }>();

  const room = params.room || 'الغرفة';
  const country = params.country || '';
  const username = params.username || 'زائر';
  const userIcon = params.icon || '⭐';

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  const [showManagement, setShowManagement] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel(`room-${room}-${country}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_name=eq.${room}`,
        },
        (payload) => {
          const row = payload.new as any;

          if (row.country !== country) return;

          setMessages((current) => {
            if (current.some((item) => item.id === row.id)) {
              return current;
            }

            return [
              ...current,
              {
                id: row.id,
                username: row.username,
                icon: row.icon || '⭐',
                text: row.message,
                time: new Date(row.created_at).toLocaleTimeString('ar-IQ', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                mine: row.username === username,
              },
            ];
          });
        }
      )
      .subscribe();

    const enterRoom = async () => {
      await supabase.from('chat_messages').insert({
        room_name: room,
        country,
        username,
        icon: userIcon,
        message: `${username} دخل الغرفة`,
      });
    };

    enterRoom();

    return () => {
      supabase.from('chat_messages').insert({
        room_name: room,
        country,
        username,
        icon: userIcon,
        message: `${username} خرج من الغرفة`,
      });

      supabase.removeChannel(channel);
    };
  }, [room, country, username, userIcon]);

  const sendMessage = async () => {
    const text = message.trim();

    if (!text) return;

    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const localMessage: Message = {
      id: localId,
      username,
      icon: userIcon,
      text,
      time: new Date().toLocaleTimeString('ar-IQ', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      mine: true,
    };

    setMessages((current) => [...current, localMessage]);
    setMessage('');

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_name: room,
        country,
        username,
        icon: userIcon,
        message: text,
      });

    if (error) {
      console.log('SEND MESSAGE ERROR:', error);
      setMessages((current) =>
        current.filter((item) => item.id !== localId)
      );
      setMessage(text);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowMenu(true)}
        >
          <Text style={styles.moreText}>☰</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageRow,
              item.mine && styles.myMessageRow,
            ]}
          >
            <View style={styles.messageHeader}>
              <Text style={styles.userIcon}>{item.icon}</Text>
              <Text style={styles.username}>{item.username}</Text>
            </View>

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

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                router.push({
                  pathname: '/room-management',
                  params: { room, country },
                });
              }}
            >
              <Text style={styles.menuIcon}>⚙️</Text>
              <Text style={styles.menuText}>إدارة الغرفة</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showManagement}
        transparent
        animationType="fade"
        onRequestClose={() => setShowManagement(false)}
      >
        <View style={styles.managementOverlay}>
          <View style={styles.managementBox}>
            <View style={styles.managementHeader}>
              <TouchableOpacity onPress={() => setShowManagement(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>

              <Text style={styles.managementTitle}>إدارة الغرفة</Text>

              <View style={{ width: 25 }} />
            </View>

            <View style={styles.managementItems}>
              <TouchableOpacity style={styles.managementItem}>
                <View style={styles.managementIconCircle}>
                  <Text style={styles.managementIcon}>⚙️</Text>
                </View>
                <Text style={styles.managementItemText}>إعدادات الغرفة</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.managementItem}>
                <View style={styles.managementIconCircle}>
                  <Text style={styles.managementIcon}>🎨</Text>
                </View>
                <Text style={styles.managementItemText}>الرتب والصلاحيات</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.managementItem}>
                <View style={styles.managementIconCircle}>
                  <Text style={styles.managementIcon}>🚫</Text>
                </View>
                <Text style={styles.managementItemText}>المحضورين</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.managementItem}>
                <View style={styles.managementIconCircle}>
                  <Text style={styles.managementIcon}>📋</Text>
                </View>
                <Text style={styles.managementItemText}>السجل</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.managementItem}>
                <View style={styles.managementIconCircle}>
                  <Text style={styles.managementIcon}>📊</Text>
                </View>
                <Text style={styles.managementItemText}>التقارير</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    fontSize: 23,
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 92,
    paddingRight: 12,
  },

  menuBox: {
    width: 170,
    backgroundColor: '#101D2D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#29415A',
    padding: 6,
  },

  menuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 8,
  },

  menuIcon: {
    fontSize: 19,
  },

  menuText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    paddingHorizontal: 5,
    gap: 5,
  },

  userIcon: {
    fontSize: 16,
  },

  username: {
    color: '#BFD0E2',
    fontSize: 12,
    fontWeight: '700',
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
    alignSelf: 'flex-start',
    backgroundColor: '#0D1B2A',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  myMessageBubble: {
    alignSelf: 'flex-end',
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
  managementOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  managementBox: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#101D2D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#29415A',
    paddingVertical: 10,
  },

  managementHeader: {
    height: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  managementTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  closeText: {
    color: '#FF7777',
    fontSize: 19,
  },

  managementItems: {
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  managementItem: {
    width: 65,
    alignItems: 'center',
  },

  managementIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0A1625',
    borderWidth: 1,
    borderColor: '#29415A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  managementIcon: {
    fontSize: 23,
  },

  managementItemText: {
    color: '#DCE7F2',
    fontSize: 9,
    marginTop: 5,
    textAlign: 'center',
  },

  inputArea: {
    minHeight: 68,
    paddingHorizontal: 10,
    paddingVertical: 10,
    paddingBottom: 37,
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
