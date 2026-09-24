import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';

export default function RoomSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ room?: string }>();

  const [privateChat, setPrivateChat] = useState(true);
  const [camera, setCamera] = useState(true);
  const [addMembers, setAddMembers] = useState(false);
  const [changeSettings, setChangeSettings] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>إعدادات الغرفة</Text>
          <Text style={styles.subtitle}>{params.room || 'الغرفة'}</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>نوع الغرفة</Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionIcon}>🌐</Text>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>غرفة مفتوحة</Text>
              <Text style={styles.optionText}>أي شخص يستطيع الدخول</Text>
            </View>
            <Text style={styles.check}>✓</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionIcon}>🔒</Text>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>غرفة مقفلة</Text>
              <Text style={styles.optionText}>الدخول يحتاج كلمة مرور</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionIcon}>🚪</Text>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>دخول بموافقة</Text>
              <Text style={styles.optionText}>يحتاج موافقة الإدارة</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>الصلاحيات</Text>

        <View style={styles.card}>
          <SettingRow
            icon="💬"
            title="المحادثة الخاصة"
            text="السماح بالمراسلة الخاصة"
            value={privateChat}
            onChange={setPrivateChat}
          />

          <SettingRow
            icon="📷"
            title="الكاميرا"
            text="السماح باستخدام الكاميرا"
            value={camera}
            onChange={setCamera}
          />

          <SettingRow
            icon="👥"
            title="إضافة أعضاء"
            text="السماح للأعضاء بإضافة أعضاء"
            value={addMembers}
            onChange={setAddMembers}
          />

          <SettingRow
            icon="⚙️"
            title="تغيير الإعدادات"
            text="السماح للأعضاء بتغيير الإعدادات"
            value={changeSettings}
            onChange={setChangeSettings}
          />
        </View>

        <Text style={styles.sectionTitle}>إعدادات إضافية</Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionIcon}>🎤</Text>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>وقت المايك</Text>
              <Text style={styles.optionText}>تحديد مدة التحدث</Text>
            </View>
            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionIcon}>👋</Text>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>لوحة الترحيب</Text>
              <Text style={styles.optionText}>رسالة تظهر عند دخول العضو</Text>
            </View>
            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionIcon}>🎨</Text>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>لون الغرفة</Text>
              <Text style={styles.optionText}>تخصيص مظهر الغرفة</Text>
            </View>
            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingRow({
  icon,
  title,
  text,
  value,
  onChange,
}: {
  icon: string;
  title: string;
  text: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.optionIcon}>{icon}</Text>

      <View style={styles.optionInfo}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionText}>{text}</Text>
      </View>

      <Switch value={value} onValueChange={onChange} />
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
  sectionTitle: {
    color: '#8FA8C2',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },
  card: {
    backgroundColor: '#DEDAD1',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C2BDB3',
    overflow: 'hidden',
  },
  option: {
    minHeight: 68,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#C9C4BA',
  },
  settingRow: {
    minHeight: 68,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#C9C4BA',
  },
  optionIcon: {
    width: 38,
    textAlign: 'center',
    fontSize: 22,
  },
  optionInfo: {
    flex: 1,
    marginHorizontal: 10,
  },
  optionTitle: {
    color: '#202020',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  optionText: {
    color: '#71869A',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  check: {
    color: '#35D07F',
    fontSize: 20,
    fontWeight: '800',
  },
  arrow: {
    color: '#71869A',
    fontSize: 26,
  },
});
