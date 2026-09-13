import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RoomLogScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹</Text></TouchableOpacity>
        <View style={styles.headerInfo}><Text style={styles.title}>السجل</Text><Text style={styles.subtitle}>سجل أحداث الغرفة</Text></View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>📋</Text>
          <View style={styles.infoText}><Text style={styles.infoTitle}>سجل الغرفة</Text><Text style={styles.infoDesc}>يظهر هنا دخول وخروج الأعضاء وإجراءات المشرفين</Text></View>
        </View>

        <Text style={styles.sectionTitle}>آخر الأحداث</Text>
        <View style={styles.card}>
          <View style={styles.logRow}>
            <Text style={styles.logIcon}>🟢</Text>
            <View style={styles.logInfo}><Text style={styles.logTitle}>لا توجد سجلات حالياً</Text><Text style={styles.logUser}>سيظهر هنا سجل أحداث الغرفة</Text></View>
            <Text style={styles.logTime}>--:--</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.clearButton} activeOpacity={0.8}>
          <Text style={styles.clearIcon}>🗑️</Text><Text style={styles.clearText}>مسح السجل</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },
  header: { height: 95, paddingTop: 40, paddingHorizontal: 16, backgroundColor: '#0A1725', borderBottomWidth: 1, borderBottomColor: '#1B2D40', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: '#FFFFFF', fontSize: 38 },
  headerInfo: { flex: 1, alignItems: 'center' },
  title: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  subtitle: { color: '#71869A', fontSize: 11, marginTop: 4 },
  content: { padding: 16, paddingBottom: 40 },
  infoCard: { backgroundColor: '#101D2D', borderRadius: 14, borderWidth: 1, borderColor: '#29415A', padding: 16, flexDirection: 'row-reverse', alignItems: 'center' },
  infoIcon: { fontSize: 30, width: 48, textAlign: 'center' },
  infoText: { flex: 1, marginHorizontal: 10 },
  infoTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', textAlign: 'right' },
  infoDesc: { color: '#71869A', fontSize: 11, marginTop: 5, textAlign: 'right' },
  sectionTitle: { color: '#8FA8C2', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 18 },
  card: { backgroundColor: '#101D2D', borderRadius: 14, borderWidth: 1, borderColor: '#29415A', overflow: 'hidden' },
  logRow: { minHeight: 72, paddingHorizontal: 14, flexDirection: 'row-reverse', alignItems: 'center' },
  logIcon: { fontSize: 20, width: 38, textAlign: 'center' },
  logInfo: { flex: 1, marginHorizontal: 10 },
  logTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', textAlign: 'right' },
  logUser: { color: '#71869A', fontSize: 11, marginTop: 4, textAlign: 'right' },
  logTime: { color: '#71869A', fontSize: 11 },
  clearButton: { marginTop: 16, height: 52, borderRadius: 12, backgroundColor: '#101D2D', borderWidth: 1, borderColor: '#5A2930', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  clearIcon: { fontSize: 18 },
  clearText: { color: '#FF8B8B', fontSize: 14, fontWeight: '700' },
});
