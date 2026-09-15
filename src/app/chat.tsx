import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
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
  Animated,
  PanResponder,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Room } from 'livekit-client';

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
  const liveKitRoomRef = useRef<Room | null>(null);

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
  const [loadError, setLoadError] = useState('');
  const [showMicPanel, setShowMicPanel] = useState(false);
  const [micSpeaker, setMicSpeaker] = useState('');
  const [micSpeakerIcon, setMicSpeakerIcon] = useState('');
  const [micSeconds, setMicSeconds] = useState(420);
  const [micQueue, setMicQueue] = useState<
    { id: number; username: string; user_icon: string }[]
  >([]);

  const [roomMembers, setRoomMembers] = useState<
    { username: string; icon: string }[]
  >([]);

  const connectLiveKit = async () => {
    try {
      const response = await fetch(
        'https://jdiqyulljbdmdugnymbr.supabase.co/functions/v1/bright-endpoint',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''}`,
          },
          body: JSON.stringify({
            room_name: room,
            participant_identity: `${username}-${Date.now()}`,
            participant_name: username,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.server_url || !data.participant_token) {
        console.log('LIVEKIT TOKEN ERROR:', data);
        return;
      }

      const liveKitRoom = new Room();
      await liveKitRoom.connect(
        data.server_url,
        data.participant_token,
      );

      liveKitRoomRef.current = liveKitRoom;

      await liveKitRoom.localParticipant.setMicrophoneEnabled(false);

      console.log('LIVEKIT CONNECTED:', room);
    } catch (error) {
      console.log('LIVEKIT CONNECT ERROR:', error);
    }
  };

  useEffect(() => {
    // connectLiveKit();

    return () => {
      const liveKitRoom = liveKitRoomRef.current;

      if (liveKitRoom) {
        liveKitRoom.disconnect();
        liveKitRoomRef.current = null;
      }
    };
  }, [room, username]);

  const micPanelX = useState(new Animated.Value(-310))[0];

  const openMicPanel = () => {
    setShowMicPanel(true);
    Animated.spring(micPanelX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 70,
      friction: 12,
    }).start();
  };

  const closeMicPanel = () => {
    Animated.timing(micPanelX, {
      toValue: -310,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setShowMicPanel(false));
  };

  const micPanResponder = useState(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dx > 15 && Math.abs(gesture.dy) < 80,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 60) {
          openMicPanel();
        }
      },
    })
  )[0];

  useEffect(() => {
    let channel: any;

    try {
      channel = supabase
      .channel(`room-${room}-${country}`)
      .on(
        'presence',
        { event: 'sync' },
        () => {
          const state = channel.presenceState();

          const members: { username: string; icon: string }[] = [];

          Object.values(state).forEach((presences: any) => {
            (presences as any[]).forEach((presence: any) => {
              if (!presence?.username) return;

              if (
                !members.some(
                  (item) => item.username === presence.username
                )
              ) {
                members.push({
                  username: presence.username,
                  icon: presence.icon || '⭐',
                });
              }
            });
          });

          setRoomMembers(members);
        }
      )
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
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            username,
            icon: userIcon,
          });
        }
      });

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
    } catch (error) {
      console.error('CHAT LOAD ERROR:', error);
      setLoadError(String(error));
    }

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

  useEffect(() => {
    if (!micSpeaker || micSeconds <= 0) return;

    const timer = setInterval(() => {
      setMicSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [micSpeaker, micSeconds]);

  const loadMicQueue = async () => {
    const { data, error } = await supabase
      .from('room_mic_queue')
      .select('id, username, user_icon')
      .eq('room_name', room)
      .eq('status', 'waiting')
      .order('created_at', { ascending: true });

    if (error) {
      console.log('room_mic_queue load error:', error.message);
      return;
    }

    setMicQueue(data || []);
  };

  const loadRoomMic = async () => {
    const { data, error } = await supabase
      .from('room_mics')
      .select('speaker_username, speaker_icon, started_at, expires_at, status')
      .eq('room_name', room)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.log('room_mics load error:', error.message);
      return;
    }

    if (!data) {
      setMicSpeaker('');
      setMicSpeakerIcon('');
      setMicSeconds(420);
      return;
    }

    setMicSpeaker(data.speaker_username || '');
    setMicSpeakerIcon(data.speaker_icon || '');

    if (data.expires_at) {
      const remaining = Math.max(
        0,
        Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000)
      );
      setMicSeconds(remaining);
    }
  };

  useEffect(() => {
    loadRoomMic();
    loadMicQueue();
  }, [room]);

  useEffect(() => {
    const queueChannel = supabase
      .channel(`room-mic-queue-${room}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_mic_queue',
          filter: `room_name=eq.${room}`,
        },
        () => {
          loadMicQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(queueChannel);
    };
  }, [room]);

  useEffect(() => {
    const micChannel = supabase
      .channel(`room-mic-${room}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_mics',
          filter: `room_name=eq.${room}`,
        },
        () => {
          loadRoomMic();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(micChannel);
    };
  }, [room]);

  useEffect(() => {
    if (!micSpeaker || micSeconds != 0) return;

    const expireMic = async () => {
      const { error } = await supabase
        .from('room_mics')
        .update({
          status: 'ended',
          expires_at: new Date().toISOString(),
        })
        .eq('room_name', room)
        .eq('speaker_username', micSpeaker)
        .eq('status', 'active');

      if (error) {
        console.log('room_mics expire error:', error.message);
        return;
      }

      setMicSpeaker('');
      setMicSpeakerIcon('');
      setMicSeconds(420);
    };

    expireMic();
  }, [micSeconds, micSpeaker, room]);

  const formatMicTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const handleMicPress = async () => {
    if (micSpeaker === username) {
      const { error } = await supabase
        .from('room_mics')
        .update({
          status: 'ended',
          expires_at: new Date().toISOString(),
        })
        .eq('room_name', room)
        .eq('speaker_username', username)
        .eq('status', 'active');

      if (error) {
        console.log('room_mics leave error:', error.message);
        return;
      }

      setMicSpeaker('');
      setMicSpeakerIcon('');
      setMicSeconds(420);
      return;
    }

    if (micSpeaker) {
      const alreadyWaiting = micQueue.some(
        (item) => item.username === username
      );

      if (alreadyWaiting) {
        return;
      }

      const { error } = await supabase
        .from('room_mic_queue')
        .insert({
          room_name: room,
          country,
          username,
          user_icon: userIcon,
          status: 'waiting',
        });

      if (error) {
        console.log('room_mic_queue insert error:', error.message);
        return;
      }

      await loadMicQueue();
      return;
    }

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + 7 * 60 * 1000);

    const { error } = await supabase
      .from('room_mics')
      .insert({
        room_name: room,
        country,
        speaker_username: username,
        speaker_icon: userIcon,
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'active',
      });

    if (error) {
      console.log('room_mics start error:', error.message);
      return;
    }

    setMicSpeaker(username);
    setMicSpeakerIcon(userIcon);
    setMicSeconds(420);
  };

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
      console.log('SEND MESSAGE ERROR:', JSON.stringify(error, null, 2));
      setMessages((current) =>
        current.filter((item) => item.id !== localId)
      );
      setMessage(text);
    }
  };

  return (
    <>
      <View
        style={styles.swipeEdge}
        {...micPanResponder.panHandlers}
      />

      <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.roomTitle}>
            {micSpeaker ? `🎙️ ${micSpeaker}` : 'Mic Free'}
          </Text>
          <Text style={styles.roomSubtitle}>
            {micSpeaker ? formatMicTime(micSeconds) : '-:-'}
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

      {showMicPanel && (
        <Pressable
          style={styles.micPanelOverlay}
          onPress={closeMicPanel}
        >
          <Animated.View
            style={[
              styles.micPanel,
              { transform: [{ translateX: micPanelX }] },
            ]}
            onStartShouldSetResponder={() => true}
          >
              <View style={styles.micMembersBox}>
              {micSpeaker ? (
                <View style={styles.micMemberItem}>
                  <Text style={styles.micMemberIcon}>🎙️</Text>
                  <Text style={styles.micMemberName}>
                    {micSpeaker}
                  </Text>
                </View>
              ) : null}

              {micQueue.map((item) => (
                <View key={item.id} style={styles.micMemberItem}>
                  <Text style={styles.micMemberIcon}>✋</Text>
                  <Text style={styles.micMemberName}>
                    {item.username}
                  </Text>
                </View>
              ))}

              {roomMembers
                .filter((member) => member.username !== micSpeaker)
                .map((member, index) => (
                  <View
                    key={`${member.username}-${index}`}
                    style={styles.micMemberItem}
                  >
                    <Text style={styles.micMemberIcon}>
                      {member.icon || '⭐'}
                    </Text>
                    <Text style={styles.micMemberName}>
                      {member.username}
                    </Text>
                  </View>
                ))}
            </View>
          </Animated.View>
        </Pressable>
      )}

      <View style={styles.inputArea}>
        <TouchableOpacity
          style={styles.bottomMicButton}
          onPress={handleMicPress}
          activeOpacity={0.75}
        >
          <Text style={styles.bottomMicText}>🎙️</Text>
        </TouchableOpacity>

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
    </>
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

  swipeEdge: {
    position: 'absolute',
    left: 0,
    top: 92,
    bottom: 68,
    width: 28,
    zIndex: 50,
  },

  micPanelOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  micPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    minWidth: 300,
    maxWidth: 380,
    backgroundColor: 'rgba(10,23,37,0.88)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(41,65,90,0.8)',
    paddingTop: 48,
    paddingHorizontal: 16,
  },

  micPanelHeader: {
    height: 48,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  micPanelTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },

  micClose: {
    color: '#FF7777',
    fontSize: 20,
  },

  micStatusBox: {
    marginTop: 25,
    backgroundColor: '#101D2D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#29415A',
    paddingVertical: 22,
    alignItems: 'center',
  },

  micIcon: {
    fontSize: 42,
  },

  micSpeaker: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },

  micTimer: {
    color: '#2196F3',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 8,
  },

  micRequestButton: {
    height: 48,
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  micRequestText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  micLeaveButton: {
    height: 44,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: '#18293B',
    borderWidth: 1,
    borderColor: '#29415A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  micLeaveText: {
    color: '#FF7777',
    fontSize: 14,
    fontWeight: '700',
  },

  micMembersBox: {
    marginTop: 18,
    backgroundColor: 'rgba(16,29,45,0.72)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(41,65,90,0.8)',
    padding: 12,
  },

  micMemberItem: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(41,65,90,0.55)',
    paddingVertical: 7,
  },

  micMemberIcon: {
    fontSize: 20,
    marginHorizontal: 7,
  },

  micMemberName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },

  micQueueBox: {
    marginTop: 18,
    backgroundColor: 'rgba(16,29,45,0.72)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(41,65,90,0.8)',
    padding: 12,
  },

  micSectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 10,
  },

  micEmptyText: {
    color: '#8FA3B8',
    fontSize: 13,
    textAlign: 'right',
    paddingVertical: 8,
  },

  micQueueItem: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(41,65,90,0.55)',
    paddingVertical: 7,
  },

  micQueueNumber: {
    width: 24,
    color: '#6FA8DC',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },

  micQueueIcon: {
    fontSize: 20,
    marginHorizontal: 7,
  },

  micQueueName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
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
  bottomMicButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  bottomMicText: {
    fontSize: 23,
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
