import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RoomReportsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹</Text></TouchableOpacity>
        <View style={styles.headerInfo}><Text style={styles.title}>التقارير</Text><Text style={styles.subtitle}>تقارير وإحصائيات الغرفة</Text></View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.icon}>📊</Text>
          <Text style={styles.cardTitle}>إحصائيات الغرفة</Text>
          <Text style={styles.cardText}>لا توجد بيانات فعلية حالياً، هذه الصفحة تجريبية.</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statNumber}>0</Text><Text style={styles.statText}>الأعضاء</Text></View>
          <View style={styles.stat}><Text style={styles.statNumber}>0</Text><Text style={styles.statText}>الدخول</Text></View>
          <View style={styles.stat}><Text style={styles.statNumber}>0</Text><Text style={styles.statText}>الإجراءات</Text></View>
        </View>

        <Text style={styles.sectionTitle}>تقارير المشرفين</Text>
        <View style={styles.card}>
          <View style={styles.row}><Text style={styles.rowIcon}>🛡️</Text><Text style={styles.rowText}>لا توجد تقارير حالياً</Text></View>
        </View>

        <TouchableOpacity style={styles.deleteButton} activeOpacity={0.8}>
          <Text style={styles.deleteIcon}>🗑️</Text><Text style={styles.deleteText}>حذف التقارير</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F2ED' },
  header: { height: 95, paddingTop: 40, paddingHorizontal: 16, backgroundColor: '#ECE9E2', borderBottomWidth: 1, borderBottomColor: '#C9C4BA', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: '#202020', fontSize: 38 },
  headerInfo: { flex: 1, alignItems: 'center' },
  title: { color: '#202020', fontSize: 19, fontWeight: '800' },
  subtitle: { color: '#71869A', fontSize: 11, marginTop: 4 },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#DEDAD1', borderRadius: 14, borderWidth: 1, borderColor: '#C2BDB3', padding: 16 },
  icon: { fontSize: 30, textAlign: 'center' },
  cardTitle: { color: '#202020', fontSize: 15, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  cardText: { color: '#71869A', fontSize: 11, textAlign: 'center', marginTop: 5 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stat: { flex: 1, backgroundColor: '#DEDAD1', borderRadius: 12, borderWidth: 1, borderColor: '#C2BDB3', paddingVertical: 16, alignItems: 'center' },
  statNumber: { color: '#202020', fontSize: 22, fontWeight: '800' },
  statText: { color: '#71869A', fontSize: 10, marginTop: 4 },
  sectionTitle: { color: '#8FA8C2', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 18 },
  row: { minHeight: 55, flexDirection: 'row-reverse', alignItems: 'center' },
  rowIcon: { fontSize: 20, width: 35, textAlign: 'center' },
  rowText: { flex: 1, color: '#DCE7F2', fontSize: 13, textAlign: 'right', marginHorizontal: 10 },
  deleteButton: { marginTop: 16, height: 52, borderRadius: 12, backgroundColor: '#DEDAD1', borderWidth: 1, borderColor: '#5A2930', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteIcon: { fontSize: 18 },
  deleteText: { color: '#FF8B8B', fontSize: 14, fontWeight: '700' },
});
