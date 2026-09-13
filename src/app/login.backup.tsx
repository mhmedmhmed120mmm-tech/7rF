import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { supabase } from '@/lib/supabase';

type LoginType = 'registered' | 'member' | 'guest';

type SavedLogin = {
  username: string;
  password?: string;
  roomPassword?: string;
  icon: string;
};

const STORAGE_KEY = '@7rF_saved_logins';

export default function LoginScreen() {
  const router = useRouter();

  const { room, country } = useLocalSearchParams<{
    room?: string;
    country?: string;
  }>();

  const [type, setType] = useState<LoginType>('registered');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [icon, setIcon] = useState('⭐');

  const [savedLogins, setSavedLogins] = useState<SavedLogin[]>([]);
  const [showNames, setShowNames] = useState(false);
  const [showIcons, setShowIcons] = useState(false);
  const [loading, setLoading] = useState(false);

  const icons = ['⭐', '👑', '🦋', '💀', '🔥', '❤️', '💎', '🌙', '⚡', '🎯', '🦁', '🐉'];

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setSavedLogins(JSON.parse(data));
      }
    } catch {}
  };

  const saveLogin = async () => {
    if (!username.trim()) {
      Alert.alert('تنبيه', 'اكتب اسم المستخدم أولاً');
      return;
    }

    const newLogin: SavedLogin = {
      username: username.trim(),
      password: password || undefined,
      roomPassword: roomPassword || undefined,
      icon,
    };

    try {
      const old = savedLogins.filter(
        item => item.username !== newLogin.username
      );

      const updated = [newLogin, ...old].slice(0, 10);

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );

      setSavedLogins(updated);
      Alert.alert('تم الحفظ', 'تم حفظ بيانات الدخول');
    } catch {
      Alert.alert('خطأ', 'تعذر حفظ البيانات');
    }
  };

  const selectSaved = (item: SavedLogin) => {
    setUsername(item.username);
    setPassword(item.password || '');
    setRoomPassword(item.roomPassword || '');
    setIcon(item.icon || '⭐');
    setShowNames(false);
  };

  const enterRoom = async () => {
    if (!username.trim()) {
      Alert.alert('تنبيه', 'اكتب اسم المستخدم');
      return;
    }

    if (type === 'registered') {
      if (!password.trim()) {
        Alert.alert('تنبيه', 'اكتب كلمة مرور المسجل');
        return;
      }

      setLoading(true);

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id,username,display_name,role,login_email')
          .eq('username', username.trim())
          .maybeSingle();

        if (profileError) {
          Alert.alert('خطأ', 'تعذر الاتصال بقاعدة البيانات');
          return;
        }

        if (!profile || !profile.login_email) {
          Alert.alert('خطأ', 'اسم المستخدم أو كلمة المرور غير صحيحة');
          return;
        }

        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: profile.login_email,
            password: password.trim(),
          });

        if (authError || !authData.user) {
          Alert.alert('خطأ', 'اسم المستخدم أو كلمة المرور غير صحيحة');
          return;
        }

        router.replace({
          pathname: '/chat',
          params: {
            room: room || '',
            country: country || '',
            username: profile.username,
            loginType: type,
            icon,
            role: profile.role,
          },
        });
      } catch {
        Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الدخول');
      } finally {
        setLoading(false);
      }

      return;
    }

    if (type === 'member' && !roomPassword.trim()) {
      Alert.alert('تنبيه', 'اكتب كلمة مرور الغرفة');
      return;
    }

    router.replace({
      pathname: '/chat',
      params: {
        room: room || '',
        country: country || '',
        username: username.trim(),
        loginType: type,
        icon,
      },
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.box}>
        <View style={styles.types}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'registered' && styles.activeType]}
            onPress={() => setType('registered')}
          >
            <Text style={styles.typeText}>مسجل</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, type === 'member' && styles.activeType]}
            onPress={() => setType('member')}
          >
            <Text style={styles.typeText}>عضو</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, type === 'guest' && styles.activeType]}
            onPress={() => setType('guest')}
          >
            <Text style={styles.typeText}>زائر</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.arrow}
            onPress={() => setShowNames(true)}
          >
            <Text style={styles.arrowText}>▼</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.username}
            placeholder="اسم المستخدم"
            placeholderTextColor="#8b96a8"
            value={username}
            onChangeText={setUsername}
            textAlign="right"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowIcons(true)}
          >
            <Text style={styles.selectedIcon}>{icon}</Text>
          </TouchableOpacity>
        </View>

        {type === 'registered' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="كلمة مرور المسجل"
              placeholderTextColor="#8b96a8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textAlign="right"
            />

            <TextInput
              style={styles.input}
              placeholder="كلمة مرور الغرفة إذا موجودة"
              placeholderTextColor="#8b96a8"
              value={roomPassword}
              onChangeText={setRoomPassword}
              secureTextEntry
              textAlign="right"
            />
          </>
        )}

        {type === 'member' && (
          <TextInput
            style={styles.input}
            placeholder="كلمة مرور الغرفة"
            placeholderTextColor="#8b96a8"
            value={roomPassword}
            onChangeText={setRoomPassword}
            secureTextEntry
            textAlign="right"
          />
        )}

        <View style={styles.bottom}>
          <TouchableOpacity onPress={enterRoom} disabled={loading}>
            <Text style={styles.enter}>
              {loading ? 'جاري الدخول...' : 'دخول'}
            </Text>
          </TouchableOpacity>

          <View style={styles.cancelArea}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.cancel}>إلغاء</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.save}
              onPress={saveLogin}
            >
              <Text style={styles.saveIcon}>💾</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal
        visible={showNames}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNames(false)}
      >
        <Pressable
          style={styles.modalBackground}
          onPress={() => setShowNames(false)}
        >
          <View style={styles.namesBox}>
            <Text style={styles.modalTitle}>الأسماء المحفوظة</Text>

            {savedLogins.length === 0 ? (
              <Text style={styles.empty}>لا توجد أسماء محفوظة</Text>
            ) : (
              <FlatList
                data={savedLogins}
                keyExtractor={(item, index) => item.username + index}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.savedItem}
                    onPress={() => selectSaved(item)}
                  >
                    <Text style={styles.savedIcon}>{item.icon}</Text>
                    <Text style={styles.savedName}>{item.username}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showIcons}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIcons(false)}
      >
        <Pressable
          style={styles.modalBackground}
          onPress={() => setShowIcons(false)}
        >
          <View style={styles.iconsBox}>
            <Text style={styles.modalTitle}>اختر العلامة</Text>

            <View style={styles.iconsGrid}>
              {icons.map(item => (
                <TouchableOpacity
                  key={item}
                  style={styles.iconChoice}
                  onPress={() => {
                    setIcon(item);
                    setShowIcons(false);
                  }}
                >
                  <Text style={styles.bigIcon}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'rgba(7,17,31,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
    width: 285,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#101d2d',
    borderWidth: 1,
    borderColor: '#263a52',
  },
  types: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 7,
  },
  activeType: {
    backgroundColor: '#1769aa',
  },
  typeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    height: 39,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1625',
    borderRadius: 7,
    marginBottom: 7,
  },
  arrow: {
    width: 34,
    alignItems: 'center',
  },
  arrowText: {
    color: '#aebbd0',
    fontSize: 12,
  },
  username: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    paddingHorizontal: 4,
  },
  iconButton: {
    width: 36,
    alignItems: 'center',
  },
  selectedIcon: {
    fontSize: 18,
  },
  input: {
    height: 39,
    backgroundColor: '#0a1625',
    borderRadius: 7,
    color: '#fff',
    fontSize: 13,
    paddingHorizontal: 10,
    marginBottom: 7,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 5,
  },
  enter: {
    color: '#55aaff',
    fontSize: 14,
    fontWeight: '700',
    paddingTop: 4,
  },
  cancelArea: {
    alignItems: 'center',
  },
  cancel: {
    color: '#ff7777',
    fontSize: 14,
    fontWeight: '700',
  },
  save: {
    marginTop: 3,
  },
  saveIcon: {
    fontSize: 17,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  namesBox: {
    width: 260,
    maxHeight: 330,
    backgroundColor: 'rgba(16,29,45,0.96)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#35516d',
  },
  iconsBox: {
    width: 280,
    backgroundColor: 'rgba(16,29,45,0.96)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#35516d',
  },
  modalTitle: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  empty: {
    color: '#9aa8ba',
    textAlign: 'center',
    padding: 15,
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1625',
    borderRadius: 8,
    padding: 9,
    marginBottom: 6,
  },
  savedIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  savedName: {
    color: '#fff',
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  iconChoice: {
    width: 52,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#0a1625',
    margin: 4,
  },
  bigIcon: {
    fontSize: 25,
  },
});
