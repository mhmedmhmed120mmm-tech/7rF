import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  FlatList,
  Animated,
  PanResponder,
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
    role?: string;
    rank?: string;
    rankColor?: string;
    rankPriority?: string;
  }>();

  const room = params.room || 'الغرفة';
  const country = params.country || '';
  const username = params.username || 'زائر';
  const userIcon = params.icon || '⭐';
  const loginType = params.loginType || 'guest';
  const role = params.role || '';
  const rank = params.rank || '';
  const rankPriority = Number(params.rankPriority || 0);

  const [canManageRoom, setCanManageRoom] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  const [showManagement, setShowManagement] = useState(false);

  const [showMicPanel, setShowMicPanel] = useState(false);
  const [micSpeaker, setMicSpeaker] = useState('');
  const [micSpeakerIcon, setMicSpeakerIcon] = useState('');
  const [micSeconds, setMicSeconds] = useState(420);
  const [micQueue, setMicQueue] = useState<
    { id: number; username: string; user_icon: string }[]
  >([]);

  const [roomMembers, setRoomMembers] = useState<
    { username: string; icon: string; rankColor: string }[]
  >([]);

  useEffect(() => {
    let active = true;

    const checkManagementAccess = async () => {
      if (loginType === 'guest') {
        if (active) setCanManageRoom(false);
        return;
      }

      // المالك الحقيقي 7rF
      if (role === 'owner' && username === '7rF') {
        const { data: authData } = await supabase.auth.getUser();

        if (authData.user) {
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (
            ownerProfile?.username === '7rF' &&
            ownerProfile?.role === 'owner'
          ) {
            if (active) setCanManageRoom(true);
            return;
          }
        }
      }

      // أي عضو/موظف: الصلاحية تأتي من رتبته في نفس الغرفة فقط
      const { data: roomRank } = await supabase
        .from('room_ranks')
        .select('name, priority')
        .eq('room_id', room)
        .eq('name', username)
        .maybeSingle();

      const priority = Number(roomRank?.priority ?? rankPriority);

      // الرتبة الإدارية تبدأ من Master وما فوقها
      if (active) {
        setCanManageRoom(Boolean(roomRank && priority > 0));
      }
    };

    checkManagementAccess();

    return () => {
      active = false;
    };
  }, [room, username, loginType, role, rankPriority]);

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

  useEffect(() => {
    const presenceChannel = supabase.channel(
      `room-presence-${room}-${country}`,
      {
        config: {
          presence: {
            key: username,
          },
        },
      }
    );

    const loadMembers = async () => {
      const state = presenceChannel.presenceState();

      const users = Object.values(state).flatMap((entries: any[]) =>
        entries.map((entry) => ({
          username: entry.username || '',
          icon: entry.icon || '⭐',
        }))
      );

      const uniqueUsers = users.filter(
        (user, index, array) =>
          user.username &&
          array.findIndex((item) => item.username === user.username) === index
      );

      const members = await Promise.all(
        uniqueUsers.map(async (user) => {
          const { data: rank } = await supabase
            .from('room_ranks')
            .select('color')
            .eq('room_id', room || '')
            .eq('name', user.username)
            .maybeSingle();

          return {
            username: user.username,
            icon: user.icon,
            rankColor: rank?.color || '#202020',
          };
        })
      );

      setRoomMembers(members);
    };

    presenceChannel
      .on('presence', { event: 'sync' }, loadMembers)
      .on('presence', { event: 'join' }, loadMembers)
      .on('presence', { event: 'leave' }, loadMembers)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            username,
            icon: userIcon || '⭐',
          });

          await loadMembers();
        }
      });

    return () => {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
    };
  }, [room, country, username, userIcon]);

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
      .select(
        'speaker_username, speaker_icon, started_at, expires_at, status'
      )
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
        Math.floor(
          (new Date(data.expires_at).getTime() - Date.now()) / 1000
        )
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
    if (!micSpeaker || micSeconds <= 0) return;

    const timer = setInterval(() => {
      setMicSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [micSpeaker, micSeconds]);

  useEffect(() => {
    if (!micSpeaker || micSeconds !== 0) return;

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
      console.log('SEND MESSAGE ERROR:', error);
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
            {canManageRoom && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                router.push({
                  pathname: '/room-management',
                  params: {
                    room,
                    country,
                    username,
                    loginType,
                    role,
                    rank,
                    rankPriority: String(rankPriority),
                  },
                });
              }}
            >
              <Text style={styles.menuIcon}>⚙️</Text>
              <Text style={styles.menuText}>إدارة الغرفة</Text>
            </TouchableOpacity>
          )}

          {room === 'الدعم الفني' && (canManageRoom && (rank === 'Master' || rank === 'master' || role === 'owner')) && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                router.push({
                  pathname: '/room-admin',
                  params: { room, country, username, role, rank },
                });
              }}
            >
              <Text style={styles.menuIcon}>🏠</Text>
              <Text style={styles.menuText}>إدارة الغرف</Text>
            </TouchableOpacity>
          )}

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
            <View style={styles.micPanelHeader}>
              <TouchableOpacity onPress={closeMicPanel}>
                <Text style={styles.micClose}>✕</Text>
              </TouchableOpacity>

              <Text style={styles.micPanelTitle}>🎙️ المايك</Text>

              <View style={{ width: 25 }} />
            </View>

            <View style={styles.micStatusBox}>
              <Text style={styles.micIcon}>
                {micSpeaker ? '🎙️' : '🎤'}
              </Text>

              <Text style={styles.micSpeaker}>
                {micSpeaker || 'المايك فارغ'}
              </Text>

              <Text style={styles.micTimer}>
                {micSpeaker ? formatMicTime(micSeconds) : '-:-'}
              </Text>

              <TouchableOpacity
                style={styles.micRequestButton}
                onPress={handleMicPress}
              >
                <Text style={styles.micRequestText}>
                  {micSpeaker === username
                    ? 'إنهاء المايك'
                    : micSpeaker
                      ? 'طلب المايك'
                      : 'أخذ المايك'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.micQueueBox}>
              <Text style={styles.micSectionTitle}>
                👥 الموجودين ({roomMembers.length})
              </Text>

              {roomMembers.length === 0 ? (
                <Text style={styles.micEmptyText}>
                  لا يوجد أحد حالياً
                </Text>
              ) : (
                roomMembers.map((member) => (
                  <View key={member.username} style={styles.micQueueItem}>
                    <Text style={styles.micQueueIcon}>
                      {member.icon || '⭐'}
                    </Text>

                    <Text
                      style={[
                        styles.micQueueName,
                        { color: member.rankColor },
                      ]}
                    >
                      {member.username}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.micQueueBox}>
              <Text style={styles.micSectionTitle}>
                طابور المايك
              </Text>

              {micQueue.length === 0 ? (
                <Text style={styles.micEmptyText}>
                  لا يوجد أحد بالطابور
                </Text>
              ) : (
                micQueue.map((item, index) => (
                  <View key={item.id} style={styles.micQueueItem}>
                    <Text style={styles.micQueueNumber}>
                      {index + 1}
                    </Text>
                    <Text style={styles.micQueueIcon}>
                      {item.user_icon || '⭐'}
                    </Text>
                    <Text style={styles.micQueueName}>
                      {item.username}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </Animated.View>
        </Pressable>
      )}

      <View style={styles.inputArea}>
        <TouchableOpacity style={styles.attachButton}>
          <Text style={styles.attachText}>＋</Text>
        </TouchableOpacity>

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="اكتب رسالتك..."
          placeholderTextColor="#202020"
          style={styles.input}
          multiline
          maxLength={1000}
          textAlign="right"
        />

        <TouchableOpacity
          style={styles.bottomMicButton}
          onPress={handleMicPress}
          activeOpacity={0.75}
        >
          <Text style={styles.bottomMicText}>🎙️</Text>
        </TouchableOpacity>

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
    backgroundColor: '#F4F2ED',
  },
  header: {
    height: 92,
    paddingTop: 40,
    paddingHorizontal: 16,
    backgroundColor: '#ECE9E2',
    borderBottomWidth: 1,
    borderBottomColor: '#C9C4BA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    color: '#202020',
    fontSize: 38,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  roomTitle: {
    color: '#202020',
    fontSize: 18,
    fontWeight: '800',
  },
  roomSubtitle: {
    color: '#202020',
    fontSize: 11,
    marginTop: 4,
  },
  moreButton: {
    width: 40,
    alignItems: 'center',
  },
  moreText: {
    color: '#202020',
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
    backgroundColor: '#DEDAD1',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C2BDB3',
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
    color: '#202020',
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
    color: '#202020',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    color: '#202020',
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
    color: '#202020',
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
    backgroundColor: '#E7E4DC',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  myMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#E7E4DC',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  messageText: {
    color: '#202020',
    fontSize: 15,
    lineHeight: 21,
  },
  messageTime: {
    color: '#202020',
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
    backgroundColor: '#DEDAD1',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C2BDB3',
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
    color: '#202020',
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
    backgroundColor: '#E3E0D8',
    borderWidth: 1,
    borderColor: '#C2BDB3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  managementIcon: {
    fontSize: 23,
  },

  managementItemText: {
    color: '#202020',
    fontSize: 9,
    marginTop: 5,
    textAlign: 'center',
  },

  swipeEdge: {
    position: 'absolute',
    left: 0,
    top: 92,
    bottom: 68,
    width: 70,
    zIndex: 999,
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
    backgroundColor: '#F4F2ED',
    borderRightWidth: 1,
    borderRightColor: '#C2BDB3',
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
    color: '#202020',
    fontSize: 19,
    fontWeight: '800',
  },

  micClose: {
    color: '#FF7777',
    fontSize: 20,
  },

  micStatusBox: {
    marginTop: 25,
    backgroundColor: '#DEDAD1',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C2BDB3',
    paddingVertical: 22,
    alignItems: 'center',
  },

  micIcon: {
    fontSize: 42,
  },

  micSpeaker: {
    color: '#202020',
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
    width: '90%',
  },

  micRequestText: {
    color: '#202020',
    fontSize: 15,
    fontWeight: '800',
  },

  micQueueBox: {
    marginTop: 18,
    backgroundColor: '#E8E5DE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C2BDB3',
    padding: 12,
  },

  micSectionTitle: {
    color: '#202020',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 10,
  },

  micEmptyText: {
    color: '#202020',
    fontSize: 13,
    textAlign: 'right',
    paddingVertical: 8,
  },

  micQueueItem: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#C9C4BA',
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
    color: '#202020',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },

  inputArea: {
    minHeight: 68,
    paddingHorizontal: 10,
    paddingVertical: 10,
    paddingBottom: 37,
    backgroundColor: '#ECE9E2',
    borderTopWidth: 1,
    borderTopColor: '#C9C4BA',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8E5DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachText: {
    color: '#202020',
    fontSize: 24,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 21,
    backgroundColor: '#E8E5DE',
    color: '#202020',
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
    color: '#202020',
    fontSize: 19,
  },
});
