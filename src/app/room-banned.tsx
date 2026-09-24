import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const bannedUsers = [
  {
    username: 'لا يوجد',
    reason: 'حالياً لا توجد حسابات محظورة',
  },
];

export default function RoomBannedScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>المحضورين</Text>
          <Text style={styles.subtitle}>إدارة الحسابات المحظورة</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topCard}>
          <Text style={styles.topIcon}>🚫</Text>
          <View style={styles.topInfo}>
            <Text style={styles.topTitle}>قائمة المحضورين</Text>
            <Text style={styles.topText}>
              الحسابات الموجودة هنا لا تستطيع دخول الغرفة
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          {bannedUsers.map((user) => (
            <View key={user.username} style={styles.userRow}>
              <Text style={styles.userIcon}>👤</Text>

              <View style={styles.userInfo}>
                <Text style={styles.username}>{user.username}</Text>
                <Text style={styles.reason}>{user.reason}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
        >
          <Text style={styles.addIcon}>🚫</Text>
          <Text style={styles.addText}>إضافة حظر</Text>
        </TouchableOpacity>
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

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  topCard: {
    backgroundColor: '#DEDAD1',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C2BDB3',
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 14,
  },

  topIcon: {
    fontSize: 30,
    width: 48,
    textAlign: 'center',
  },

  topInfo: {
    flex: 1,
    marginHorizontal: 10,
  },

  topTitle: {
    color: '#202020',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },

  topText: {
    color: '#71869A',
    fontSize: 11,
    marginTop: 5,
    textAlign: 'right',
  },

  card: {
    backgroundColor: '#DEDAD1',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C2BDB3',
    overflow: 'hidden',
  },

  userRow: {
    minHeight: 75,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },

  userIcon: {
    fontSize: 25,
    width: 42,
    textAlign: 'center',
  },

  userInfo: {
    flex: 1,
    marginHorizontal: 10,
  },

  username: {
    color: '#202020',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },

  reason: {
    color: '#71869A',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },

  addButton: {
    marginTop: 16,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#DEDAD1',
    borderWidth: 1,
    borderColor: '#C2BDB3',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  addIcon: {
    fontSize: 19,
  },

  addText: {
    color: '#202020',
    fontSize: 14,
    fontWeight: '700',
  },
});
