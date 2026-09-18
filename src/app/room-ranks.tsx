import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Rank = {
  id?: string | number;
  room_id?: string;
  name: string;
  color: string;
  priority?: number;
};

const defaultRanks = [
  { icon: '🔴', name: 'Master', color: '#FF4B4B', desc: 'مالك الغرفة وجميع الصلاحيات' },
  { icon: '🟢', name: 'Super Admin', color: '#35D07F', desc: 'صلاحيات إدارية واسعة' },
  { icon: '🔵', name: 'Admin', color: '#2196F3', desc: 'صلاحيات إدارية محدودة' },
  { icon: '🟣', name: 'Minbar', color: '#B98CFF', desc: 'صلاحية الرسائل الخاصة' },
  { icon: '👤', name: 'Guest', color: '#8FA8C2', desc: 'زائر عادي' },
];

const rankColors = [
  '#2196F3',
  '#FF4B4B',
  '#35D07F',
  '#B98CFF',
  '#FFD54F',
  '#FF8A65',
];

export default function RoomRanksScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ room?: string }>();

  const roomId = String(params.room || 'الغرفة');

  const [dbRanks, setDbRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRank, setShowAddRank] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newRankName, setNewRankName] = useState('');
  const [newRankColor, setNewRankColor] = useState('#2196F3');

  const loadRanks = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('room_ranks')
      .select('*')
      .eq('room_id', roomId)
      .order('priority', { ascending: false });

    if (error) {
      console.log('RANK ERROR:', JSON.stringify(error, null, 2)); Alert.alert('خطأ', error.message);
      setDbRanks([]);
    } else {
      setDbRanks((data || []) as Rank[]);
    }

    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    loadRanks();
  }, [loadRanks]);

  const addRank = async () => {
    const name = newRankName.trim();

    if (!name) {
      Alert.alert('تنبيه', 'اكتب اسم الرتبة أولاً');
      return;
    }

    if (name.length > 30) {
      Alert.alert('تنبيه', 'اسم الرتبة يجب ألا يتجاوز 30 حرفاً');
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('room_ranks')
      .insert({
        room_id: roomId,
        name,
        color: newRankColor,
        priority: 0,
      });

    setSaving(false);

    if (error) {
      console.log('RANK ERROR:', JSON.stringify(error, null, 2)); Alert.alert('خطأ', error.message);
      return;
    }

    setNewRankName('');
    setNewRankColor('#2196F3');
    setShowAddRank(false);

    await loadRanks();

    Alert.alert('تم', 'تمت إضافة الرتبة بنجاح');
  };

  const closeAddModal = () => {
    if (saving) return;

    setShowAddRank(false);
    setNewRankName('');
    setNewRankColor('#2196F3');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.title}>الرتب والصلاحيات</Text>
          <Text style={styles.subtitle}>إدارة رتب أعضاء الغرفة</Text>
        </View>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>الرتب الأساسية</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rankScroll}
        >
          {defaultRanks.map((rank) => (
            <View key={rank.name} style={styles.rankItem}>
              <View
                style={[
                  styles.rankCircle,
                  { borderColor: rank.color },
                ]}
              >
                <Text style={styles.rankIcon}>{rank.icon}</Text>
              </View>

              <Text style={styles.rankName}>{rank.name}</Text>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>الرتب المخصصة</Text>

        <View style={styles.card}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.loadingText}>جاري تحميل الرتب...</Text>
            </View>
          ) : dbRanks.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🏷️</Text>
              <Text style={styles.emptyTitle}>لا توجد رتب مخصصة</Text>
              <Text style={styles.emptyText}>
                يمكنك إنشاء رتبة جديدة لأعضاء الغرفة
              </Text>
            </View>
          ) : (
            dbRanks.map((rank, index) => (
              <View
                key={String(rank.id ?? `${rank.name}-${index}`)}
                style={[
                  styles.customRankRow,
                  index === dbRanks.length - 1 && styles.lastRow,
                ]}
              >
                <View
                  style={[
                    styles.customRankCircle,
                    { borderColor: rank.color || '#2196F3' },
                  ]}
                >
                  <Text style={styles.customRankIcon}>★</Text>
                </View>

                <View style={styles.customRankInfo}>
                  <Text style={styles.customRankName}>{rank.name}</Text>
                  <Text style={styles.customRankPriority}>
                    رتبة مخصصة
                  </Text>
                </View>

                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: rank.color || '#2196F3' },
                  ]}
                />
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>إدارة الرتب</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.action}
            onPress={() => setShowAddRank(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>➕</Text>

            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>إضافة رتبة</Text>
              <Text style={styles.actionText}>
                إنشاء رتبة جديدة وتحديد لونها
              </Text>
            </View>

            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.action}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert('قريباً', 'تعديل الرتب سيكون متاحاً في الخطوة التالية')
            }
          >
            <Text style={styles.actionIcon}>✏️</Text>

            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>تعديل رتبة</Text>
              <Text style={styles.actionText}>
                تغيير الاسم واللون والصلاحيات
              </Text>
            </View>

            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.action}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert('قريباً', 'حذف الرتب سيكون متاحاً في الخطوة التالية')
            }
          >
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

      <Modal
        visible={showAddRank}
        transparent
        animationType="fade"
        onRequestClose={closeAddModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>إضافة رتبة جديدة</Text>

            <Text style={styles.inputLabel}>اسم الرتبة</Text>

            <TextInput
              style={styles.input}
              placeholder="مثال: VIP"
              placeholderTextColor="#71869A"
              value={newRankName}
              onChangeText={setNewRankName}
              maxLength={30}
              editable={!saving}
              autoCapitalize="words"
            />

            <Text style={styles.colorLabel}>لون الرتبة</Text>

            <View style={styles.colorRow}>
              {rankColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setNewRankColor(color)}
                  disabled={saving}
                  activeOpacity={0.8}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    newRankColor === color && styles.selectedColor,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                saving && styles.disabledButton,
              ]}
              onPress={addRank}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>إضافة الرتبة</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeAddModal}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  back: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 40,
  },

  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },

  headerSpace: {
    width: 40,
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

  sectionTitle: {
    color: '#8FA8C2',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 18,
    textAlign: 'right',
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

  card: {
    backgroundColor: '#101D2D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#29415A',
    overflow: 'hidden',
  },

  loadingBox: {
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  loadingText: {
    color: '#71869A',
    fontSize: 12,
  },

  emptyBox: {
    minHeight: 125,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },

  emptyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  emptyText: {
    color: '#71869A',
    fontSize: 11,
    marginTop: 5,
    textAlign: 'center',
  },

  customRankRow: {
    minHeight: 70,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1B2D40',
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  customRankCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    backgroundColor: '#07111F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  customRankIcon: {
    color: '#FFFFFF',
    fontSize: 17,
  },

  customRankInfo: {
    flex: 1,
    marginHorizontal: 12,
  },

  customRankName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },

  customRankPriority: {
    color: '#71869A',
    fontSize: 10,
    marginTop: 3,
    textAlign: 'right',
  },

  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#101D2D',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#29415A',
  },

  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 18,
  },

  inputLabel: {
    color: '#8FA8C2',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 7,
  },

  input: {
    height: 50,
    backgroundColor: '#07111F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#29415A',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    textAlign: 'right',
    fontSize: 14,
    marginBottom: 16,
  },

  colorLabel: {
    color: '#8FA8C2',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 10,
  },

  colorRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 20,
  },

  colorButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  selectedColor: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },

  saveButton: {
    height: 48,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  cancelButton: {
    height: 45,
    backgroundColor: '#1B2D40',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelButtonText: {
    color: '#B8C7D6',
    fontSize: 14,
    fontWeight: '700',
  },
});
