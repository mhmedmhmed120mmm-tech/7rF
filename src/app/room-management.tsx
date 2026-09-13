import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const items = [
  ['⚙️', 'إعدادات الغرفة'],
  ['🎨', 'الرتب والصلاحيات'],
  ['🚫', 'المحضورين'],
  ['📋', 'السجل'],
  ['📊', 'التقارير'],
];

export default function RoomManagementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ room?: string }>();

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
    backgroundColor: '#07111F',
  },
  header: {
    height: 95,
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
  title: {
    color: '#FFFFFF',
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
    backgroundColor: '#101D2D',
    borderWidth: 1,
    borderColor: '#29415A',
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
});
