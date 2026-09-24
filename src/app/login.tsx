import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
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
  Platform,
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

const getSavedLogins = async () => {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(STORAGE_KEY);
  }
  return AsyncStorage.getItem(STORAGE_KEY);
};

const saveLoginsToStorage = async (value: string) => {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, value);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, value);
};

export default function LoginScreen() {
  const router = useRouter();

  const { room, country } = useLocalSearchParams<{
    room?: string | string[];
    country?: string | string[];
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
      const data = await getSavedLogins();
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

      await saveLoginsToStorage(JSON.stringify(updated));

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

    const selectedRoom = Array.isArray(room) ? (room[0] ?? '') : (room ?? '');
    const selectedCountry = Array.isArray(country) ? (country[0] ?? '') : (country ?? '');
    const enteredName = username.trim();

    // المالك 7rF: يدخل كل الغرف بصلاحيات المالك
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
          .eq('username', enteredName)
          .limit(1)
          .maybeSingle();

        if (profileError) {
          Alert.alert('خطأ قاعدة البيانات', profileError?.message || profileError?.details || profileError?.hint || 'خطأ غير معروف');
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

        const { data: verifiedProfile, error: verifiedError } =
          await supabase
            .from('profiles')
            .select('id,username,display_name,role,login_email')
            .eq('id', authData.user.id)
            .maybeSingle();

        if (verifiedError || !verifiedProfile) {
          await supabase.auth.signOut();
          Alert.alert('خطأ', 'تعذر التحقق من صلاحيات الحساب');
          return;
        }

        // المالك 7rF فوق الجميع ويدخل كل الغرف
        if (verifiedProfile.role === 'owner' && verifiedProfile.username === '7rF') {
          router.replace({
            pathname: '/chat',
            params: {
              room: selectedRoom,
              country: selectedCountry,
              username: verifiedProfile.username,
              loginType: 'registered',
              icon,
              role: 'owner',
              rank: 'owner',
              rankColor: '#FF4B4B',
              rankPriority: '1000',
            },
          });
          return;
        }

        // المسجل يدخل كل الغرف، لكن يأخذ رتبة فقط إذا كانت له عضوية بهذه الغرفة
        const { data: rank, error: rankError } = await supabase
          .from('room_ranks')
          .select('id,name,color,priority,password,device_id')
          .eq('room_id', selectedRoom)
          .eq('name', verifiedProfile.username)
          .maybeSingle();

        if (rankError) {
          console.error('Registered room rank error:', rankError);
          await supabase.auth.signOut();
          Alert.alert('خطأ', 'تعذر التحقق من عضوية الغرفة');
          return;
        }

        // لا توجد عضوية بهذه الغرفة = يدخل كزائر
        if (!rank) {
          router.replace({
            pathname: '/chat',
            params: {
              room: selectedRoom,
              country: selectedCountry,
              username: verifiedProfile.username,
              loginType: 'registered',
              icon,
              role: verifiedProfile.role,
            },
          });
          return;
        }

        // توجد عضوية بهذه الغرفة = يستخدم رتبة هذه الغرفة فقط
        const deviceId = Application.getAndroidId();

        if (!deviceId) {
          await supabase.auth.signOut();
          Alert.alert('خطأ', 'تعذر التعرف على هذا الجهاز');
          return;
        }

        if (rank.device_id && rank.device_id !== deviceId) {
          await supabase.auth.signOut();
          Alert.alert(
            'الدخول مرفوض',
            'لا يُسمح لهذا العضو بالدخول من هذا الجهاز'
          );
          return;
        }

        if (!rank.device_id) {
          const { error: deviceError } = await supabase
            .from('room_ranks')
            .update({ device_id: deviceId })
            .eq('id', rank.id);

          if (deviceError) {
            console.error('Device binding error:', deviceError);
            await supabase.auth.signOut();
            Alert.alert('خطأ', 'تعذر تسجيل هذا الجهاز للعضو');
            return;
          }
        }

        router.replace({
          pathname: '/chat',
          params: {
            room: selectedRoom,
            country: selectedCountry,
            username: verifiedProfile.username,
            loginType: 'registered',
            icon,
            role: verifiedProfile.role,
            rank: rank.name,
            rankColor: rank.color,
            rankPriority: String(rank.priority ?? 0),
          },
        });
      } catch {
        Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الدخول');
      } finally {
        setLoading(false);
      }

      return;
    }

    // العضو: لا يدخل إلا إذا كانت له رتبة في هذه الغرفة تحديداً
      // العضو: لا يدخل إلا إذا كانت له رتبة في هذه الغرفة تحديداً
      if (type === 'member') {
        if (!roomPassword.trim()) {
          Alert.alert('تنبيه', 'اكتب كلمة مرور العضو');
          return;
        }

        const { data: ranks, error: rankError } = await supabase
          .from('room_ranks')
          .select('id,name,color,priority,password,device_id')
          .eq('room_id', selectedRoom)
          .eq('name', enteredName)
          .limit(1);

        if (rankError) {
          console.error('Member login error:', rankError);
          Alert.alert('خطأ قاعدة البيانات', rankError?.message || rankError?.details || rankError?.hint || 'خطأ غير معروف');
          return;
        }

        const rank = ranks?.[0];

        if (!rank) {
          Alert.alert(
            'الدخول مرفوض',
            'هذا الاسم غير موجود ضمن رتب هذه الغرفة'
          );
          return;
        }

        if (rank.password !== roomPassword.trim()) {
          Alert.alert(
            'خطأ',
            'اسم العضو أو كلمة المرور غير صحيحة'
          );
          return;
        }

        const deviceId = Application.getAndroidId();

        if (!deviceId) {
          Alert.alert('خطأ', 'تعذر التعرف على هذا الجهاز');
          return;
        }

        if (rank.device_id && rank.device_id !== deviceId) {
          Alert.alert(
            'الدخول مرفوض',
            'هذا الاسم مستخدم على جهاز آخر ضمن هذه الغرفة'
          );
          return;
        }

        if (!rank.device_id) {
          const { error: deviceError } = await supabase
            .from('room_ranks')
            .update({ device_id: deviceId })
            .eq('id', rank.id);

          if (deviceError) {
            console.error('Device binding error:', deviceError);
            Alert.alert(
              'خطأ',
              'تعذر تسجيل هذا الجهاز للعضو'
            );
            return;
          }
        }

        router.replace({
          pathname: '/chat',
          params: {
            room: selectedRoom,
            country: selectedCountry,
            username: enteredName,
            loginType: 'member',
            icon,
            rank: rank.name,
            rankColor: rank.color,
            rankPriority: String(rank.priority ?? 0),
          },
        });

        return;
      }

    // الزائر: يمنع انتحال أي اسم محجوز كرتبة داخل الغرفة
    const { data: existingRank, error: guestRankError } = await supabase
      .from('room_ranks')
      .select('id,name')
      .eq('room_id', selectedRoom)
      .eq('name', enteredName.trim())
      .limit(1)
      .maybeSingle();

    if (guestRankError) {
      console.error('Guest name check error:', guestRankError);
      Alert.alert(
        'خطأ قاعدة البيانات',
        guestRankError?.message || guestRankError?.details || guestRankError?.hint || 'خطأ غير معروف'
      );
      return;
    }

    if (existingRank) {
      Alert.alert(
        'الدخول مرفوض',
        'هذا الاسم محجوز لرتبة داخل هذه الغرفة. يرجى الدخول من خيار «عضو» وإدخال كلمة المرور'
      );
      return;
    }

    router.replace({
      pathname: '/chat',
      params: {
        room: selectedRoom,
        country: selectedCountry,
        username: enteredName.trim(),
        loginType: 'guest',
        icon,
      },
    });
  };

  return (
    <View style={styles.screen}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => router.back()}
      />
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
            autoFocus
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
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
    width: '96%',
    padding: 4,
    borderRadius: 10,
    backgroundColor: '#F4F2ED',
    borderWidth: 1,
    borderColor: '#C9C4BA',
  },
  types: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 3,
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
    color: '#202020',
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E5DE',
    borderRadius: 7,
    marginBottom: 3,
  },
  arrow: {
    width: 34,
    alignItems: 'center',
  },
  arrowText: {
    color: '#202020',
    fontSize: 12,
  },
  username: {
    flex: 1,
    color: '#202020',
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
    height: 34,
    backgroundColor: '#E8E5DE',
    borderRadius: 7,
    color: '#202020',
    fontSize: 13,
    paddingHorizontal: 10,
    marginBottom: 3,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 1,
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
    backgroundColor: '#F4F2ED',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C2BDB3',
  },
  iconsBox: {
    width: 280,
    backgroundColor: '#F4F2ED',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C2BDB3',
  },
  modalTitle: {
    color: '#202020',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  empty: {
    color: '#202020',
    textAlign: 'center',
    padding: 15,
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E5DE',
    borderRadius: 8,
    padding: 9,
    marginBottom: 6,
  },
  savedIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  savedName: {
    color: '#202020',
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
    backgroundColor: '#E8E5DE',
    margin: 4,
  },
  bigIcon: {
    fontSize: 25,
  },
});
