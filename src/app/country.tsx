import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const rooms = roomsByCountry[country] || [];

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
    backgroundColor: '#07111F',
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
    color: '#FFFFFF',
    fontSize: 38,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    padding: 18,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 15,
  },
  roomCard: {
    backgroundColor: '#0D1B2A',
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
    color: '#FFFFFF',
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
    backgroundColor: '#0D1B2A',
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
    color: '#FFFFFF',
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
