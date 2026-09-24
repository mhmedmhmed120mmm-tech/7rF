import { useFocusEffect } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';

const roomsByCountry: Record<string, string[]> = {
  العراق: ['العراق العامة', 'دردشة العراق', 'سوالف عراقية'],
  السعودية: ['السعودية العامة', 'دردشة السعودية'],
  الكويت: ['الكويت العامة'],
  الإمارات: ['الإمارات العامة', 'دردشة الإمارات'],
  الأردن: ['الأردن العامة'],
  مصر: ['مصر العامة', 'دردشة مصر'],
};

export default function CountryRoomsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ country?: string }>();

  const country = params.country || 'الدولة';
  const [dynamicRooms, setDynamicRooms] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadRooms = async () => {
        const now = new Date().toISOString();

        const { data, error } = await supabase
          .from('rooms')
          .select('name, country, expires_at, created_at, subscription_months')
          .eq('country', country)
          .gt('expires_at', now)
          .order('created_at', { ascending: false });

        if (!active) return;

        if (error) {
          console.log('load rooms error:', error);
          setDynamicRooms([]);
          return;
        }

        console.log('ROOMS FROM DB:', JSON.stringify(data, null, 2));
        setDynamicRooms((data || []).map((room) => room.name));
      };

      loadRooms();

      return () => {
        active = false;
      };
    }, [country])
  );

  const rooms = Array.from(
    new Set([...(roomsByCountry[country] || []), ...dynamicRooms])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{country}</Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>الغرف</Text>

        {rooms.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>لا توجد غرف متاحة حاليًا</Text>
            <Text style={styles.emptyText}>
              سيتم عرض الغرف هنا عند فتحها.
            </Text>
          </View>
        ) : (
          rooms.map((room) => (
            <TouchableOpacity
              key={room}
              style={styles.roomCard}
              activeOpacity={0.75}
              onPress={() =>
                router.push({
                  pathname: '/login',
                  params: { room, country },
                })
              }
            >
              <Text style={styles.arrow}>‹</Text>

              <View style={styles.roomInfo}>
                <Text style={styles.roomName}>💬 {room}</Text>
                <Text style={styles.roomStatus}>🟢 غرفة متاحة</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
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
    height: 90,
    paddingHorizontal: 18,
    paddingTop: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    color: '#202020',
    fontSize: 38,
  },
  title: {
    color: '#202020',
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    padding: 18,
  },
  sectionTitle: {
    color: '#202020',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 15,
  },
  roomCard: {
    backgroundColor: '#E7E4DC',
    borderRadius: 15,
    padding: 17,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  roomName: {
    color: '#202020',
    fontSize: 17,
    fontWeight: '700',
  },
  roomStatus: {
    color: '#7F94AA',
    fontSize: 12,
    marginTop: 6,
  },
  arrow: {
    color: '#6F8499',
    fontSize: 30,
    transform: [{ rotate: '180deg' }],
  },
  empty: {
    backgroundColor: '#E7E4DC',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#202020',
    fontSize: 17,
    fontWeight: '700',
  },
  emptyText: {
    color: '#7F94AA',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
