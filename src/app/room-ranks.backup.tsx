import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const ranks = [
  {
    icon: '🔴',
    name: 'Master',
    color: '#FF4B4B',
    desc: 'مالك الغرفة وجميع الصلاحيات',
  },
  {
    icon: '🟢',
    name: 'Super Admin',
    color: '#35D07F',
    desc: 'صلاحيات إدارية واسعة',
  },
  {
    icon: '🔵',
    name: 'Admin',
    color: '#2196F3',
    desc: 'صلاحيات إدارية محدودة',
  },
  {
    icon: '🟣',
    name: 'Minbar',
    color: '#B98CFF',
    desc: 'صلاحية الرسائل الخاصة',
  },
  {
    icon: '👤',
    name: 'Guest',
    color: '#8FA8C2',
    desc: 'زائر عادي',
  },
];

export default function RoomRanksScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>الرتب والصلاحيات</Text>
          <Text style={styles.subtitle}>إدارة رتب أعضاء الغرفة</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rankScroll}
        >
          {ranks.map((rank) => (
            <TouchableOpacity
              key={rank.name}
              style={styles.rankItem}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.rankCircle,
                  { borderColor: rank.color },
                ]}
              >
                <Text style={styles.rankIcon}>{rank.icon}</Text>
              </View>

              <Text style={styles.rankName}>{rank.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>إدارة الرتب</Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.action}>
            <Text style={styles.actionIcon}>➕</Text>

            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>إضافة رتبة</Text>
              <Text style={styles.actionText}>
                إنشاء رتبة جديدة وتحديد صلاحياتها
              </Text>
            </View>

            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action}>
            <Text style={styles.actionIcon}>✏️</Text>

            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>تعديل رتبة</Text>
              <Text style={styles.actionText}>
                تغيير الاسم واللون والصلاحيات
              </Text>
            </View>

            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action}>
            <Text style={styles.actionIcon}>🗑️</Text>

            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>حذف رتبة</Text>
              <Text style={styles.actionText}>
                حذف رتبة مخصصة من الغرفة
              </Text>
            </View>

            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>الصلاحيات الأساسية</Text>

        <View style={styles.card}>
          <PermissionRow icon="🎤" text="المايك" />
          <PermissionRow icon="💬" text="الرسائل الخاصة" />
          <PermissionRow icon="👥" text="إضافة أعضاء" />
          <PermissionRow icon="🚪" text="طرد عضو" />
          <PermissionRow icon="🚫" text="حظر عضو" />
          <PermissionRow icon="⏸️" text="إيقاف عضو" />
          <PermissionRow icon="⚙️" text="تغيير إعدادات الغرفة" />
        </View>
      </ScrollView>
    </View>
  );
}

function PermissionRow({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <View style={styles.permissionRow}>
      <Text style={styles.permissionIcon}>{icon}</Text>
      <Text style={styles.permissionText}>{text}</Text>
      <Text style={styles.lock}>🔐</Text>
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

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  rankScroll: {
    gap: 18,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  rankItem: {
    width: 78,
    alignItems: 'center',
  },

  rankCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#101D2D',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rankIcon: {
    fontSize: 24,
  },

  rankName: {
    color: '#DCE7F2',
    fontSize: 10,
    marginTop: 7,
    textAlign: 'center',
  },

  sectionTitle: {
    color: '#8FA8C2',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 18,
  },

  card: {
    backgroundColor: '#101D2D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#29415A',
    overflow: 'hidden',
  },

  action: {
    minHeight: 70,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1B2D40',
  },

  actionIcon: {
    width: 38,
    textAlign: 'center',
    fontSize: 21,
  },

  actionInfo: {
    flex: 1,
    marginHorizontal: 10,
  },

  actionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },

  actionText: {
    color: '#71869A',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },

  arrow: {
    color: '#71869A',
    fontSize: 26,
  },

  permissionRow: {
    minHeight: 55,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1B2D40',
  },

  permissionIcon: {
    width: 35,
    textAlign: 'center',
    fontSize: 19,
  },

  permissionText: {
    flex: 1,
    color: '#DCE7F2',
    fontSize: 13,
    textAlign: 'right',
    marginHorizontal: 10,
  },

  lock: {
    fontSize: 15,
  },
});
