import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';

const countries = [
  { name: 'العراق', flag: '🇮🇶', users: 1284, rooms: 24 },
  { name: 'السعودية', flag: '🇸🇦', users: 963, rooms: 18 },
  { name: 'الكويت', flag: '🇰🇼', users: 721, rooms: 12 },
  { name: 'الإمارات', flag: '🇦🇪', users: 615, rooms: 15 },
  { name: 'الأردن', flag: '🇯🇴', users: 438, rooms: 9 },
  { name: 'مصر', flag: '🇪🇬', users: 392, rooms: 11 },
];

export default function HomeScreen() {
  const router = useRouter();

  const openCountry = (country: string) => {
    router.push({
      pathname: '/country',
      params: { country },
    });
  };

  const openSupport = () => {
    router.push('/support');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>VrF</Text>
            <Text style={styles.welcome}>مرحباً بك في مجتمع VrF</Text>
          </View>

          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featured}>
          <View>
            <Text style={styles.featuredTitle}>الغرف المميزة</Text>
            <Text style={styles.featuredSubtitle}>أفضل الغرف النشطة حالياً</Text>
          </View>

          <TouchableOpacity style={styles.roomButton}>
            <Text style={styles.roomButtonText}>دخول</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>الدول</Text>

        {countries.map((country) => (
          <TouchableOpacity
            key={country.name}
            style={styles.countryCard}
            activeOpacity={0.75}
            onPress={() => openCountry(country.name)}
          >
            <Text style={styles.arrow}>‹</Text>

            <View style={styles.countryInfo}>
              <Text style={styles.countryName}>
                {country.flag}  {country.name}
              </Text>

              <Text style={styles.stats}>
                🟢 {country.users.toLocaleString()} متصل
                {'   '} • {'   '}
                {country.rooms} غرفة
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.totalCard}>
          <View style={styles.totalItem}>
            <Text style={styles.totalNumber}>4,413</Text>
            <Text style={styles.totalLabel}>مستخدم متصل</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalItem}>
            <Text style={styles.totalNumber}>89</Text>
            <Text style={styles.totalLabel}>غرفة نشطة</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🌍</Text>
          <Text style={styles.navActive}>الدول</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>⭐</Text>
          <Text style={styles.navText}>المفضلة</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🔍</Text>
          <Text style={styles.navText}>بحث</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={openSupport}>
          <Text style={styles.navIcon}>•••</Text>
          <Text style={styles.navText}>المزيد</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F2ED',
  },
  content: {
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    color: '#2196F3',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 3,
  },
  welcome: {
    color: '#91A4B8',
    fontSize: 13,
    marginTop: 2,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8E5DE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 22,
  },
  featured: {
    backgroundColor: '#E1DDD4',
    borderWidth: 1,
    borderColor: '#1D4F73',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  featuredTitle: {
    color: '#202020',
    fontSize: 19,
    fontWeight: '800',
  },
  featuredSubtitle: {
    color: '#8FA8C2',
    fontSize: 12,
    marginTop: 5,
  },
  roomButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  roomButtonText: {
    color: '#202020',
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#202020',
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 13,
  },
  countryCard: {
    backgroundColor: '#E7E4DC',
    borderRadius: 15,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  countryName: {
    color: '#202020',
    fontSize: 17,
    fontWeight: '700',
  },
  stats: {
    color: '#7F94AA',
    fontSize: 12,
    marginTop: 6,
  },
  arrow: {
    color: '#6F8499',
    fontSize: 30,
    transform: [{ rotate: '180deg' }],
  },
  totalCard: {
    backgroundColor: '#E7E4DC',
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  totalItem: {
    alignItems: 'center',
  },
  totalNumber: {
    color: '#2196F3',
    fontSize: 22,
    fontWeight: '900',
  },
  totalLabel: {
    color: '#8195A9',
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#D4D0C7',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: '#ECE9E2',
    borderTopWidth: 1,
    borderTopColor: '#C9C4BA',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 65,
  },
  navIcon: {
    fontSize: 19,
    marginBottom: 4,
  },
  navActive: {
    color: '#2196F3',
    fontSize: 11,
    fontWeight: '800',
  },
  navText: {
    color: '#71869A',
    fontSize: 11,
  },
});
