import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const items = [
  ['⚙️', 'إعدادات الغرفة'],
  ['🎨', 'الرتب والصلاحيات'],
  ['🚫', 'المحضورين'],
  ['📋', 'السجل'],
  ['📊', 'التقارير'],
];

export default function RoomManagementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    room?: string;
    username?: string;
    loginType?: string;
    role?: string;
    rankPriority?: string;
  }>();

  const room = params.room || '';
  const username = params.username || '';
  const loginType = params.loginType || 'guest';
  const role = params.role || '';
  const rankPriority = Number(params.rankPriority || 0);

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      if (!room || !username || loginType === 'guest') {
        if (active) {
          setAllowed(false);
          setChecking(false);
        }
        return;
      }

      // المالك 7rF
      if (username === '7rF' && role === 'owner') {
        const { data } = await supabase.auth.getUser();

        if (data.user) {
          const { data: owner } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', data.user.id)
            .maybeSingle();

          if (owner?.username === '7rF' && owner?.role === 'owner') {
            if (active) {
              setAllowed(true);
              setChecking(false);
            }
            return;
          }
        }
      }

      // أي رتبة إدارية يجب أن تكون موجودة في الغرفة الحالية
      const { data: roomRank } = await supabase
        .from('room_ranks')
        .select('name, priority')
        .eq('room_id', room)
        .eq('name', username)
        .maybeSingle();

      const priority = Number(roomRank?.priority ?? rankPriority);

      if (active) {
        setAllowed(Boolean(roomRank && priority > 0));
        setChecking(false);
      }
    };

    checkAccess();

    return () => {
      active = false;
    };
  }, [room, username, loginType, role, rankPriority]);

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#202020" />
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.title}>إدارة الغرفة</Text>
            <Text style={styles.subtitle}>{room || 'الغرفة'}</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        <View style={styles.deniedBox}>
          <Text style={styles.deniedIcon}>🔒</Text>
          <Text style={styles.deniedTitle}>غير مصرح</Text>
          <Text style={styles.deniedText}>
            لا تملك صلاحية إدارة هذه الغرفة
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>العودة للغرفة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>إدارة الغرفة</Text>
          <Text style={styles.subtitle}>{params.room || 'الغرفة'}</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.items}
      >
        {items.map(([icon, title]) => (
          <TouchableOpacity
            key={title}
            style={styles.item}
            activeOpacity={0.75}
            onPress={() => {
              if (title === 'إعدادات الغرفة') {
                router.push({
                  pathname: '/room-settings',
                  params: { room: params.room || 'الغرفة' },
                });
              }

              if (title === 'الرتب والصلاحيات') {
                router.push({
                  pathname: '/room-ranks',
                  params: { room: params.room || 'الغرفة' },
                });
              }

              if (title === 'المحضورين') {
                router.push({
                  pathname: '/room-banned',
                  params: { room: params.room || 'الغرفة' },
                });
              }

              if (title === 'السجل') {
                router.push({
                  pathname: '/room-log',
                  params: { room: params.room || 'الغرفة' },
                });
              }

              if (title === 'التقارير') {
                router.push({
                  pathname: '/room-reports',
                  params: { room: params.room || 'الغرفة' },
                });
              }
            }}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>{icon}</Text>
            </View>

            <Text style={styles.itemText}>{title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F2ED',
  },
  header: {
    height: 95,
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
  title: {
    color: '#202020',
    fontSize: 19,
    fontWeight: '800',
  },
  subtitle: {
    color: '#71869A',
    fontSize: 11,
    marginTop: 4,
  },
  items: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 18,
  },
  item: {
    width: 95,
    alignItems: 'center',
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#DEDAD1',
    borderWidth: 1,
    borderColor: '#C2BDB3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 25,
  },
  itemText: {
    color: '#DCE7F2',
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
  },
  deniedBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  deniedIcon: {
    fontSize: 42,
    marginBottom: 12,
  },
  deniedTitle: {
    color: '#202020',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  deniedText: {
    color: '#686868',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 22,
  },
  backButton: {
    backgroundColor: '#DEDAD1',
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  backButtonText: {
    color: '#202020',
    fontSize: 13,
    fontWeight: '700',
  },

});
