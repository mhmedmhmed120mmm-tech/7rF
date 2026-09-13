import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function SupportScreen() {
  const router = useRouter();

  const openSupportLogin = () => {
    router.push({
      pathname: '/login',
      params: {
        room: 'الدعم الفني',
        country: 'الدعم الفني',
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSpace} />
        <Text style={styles.headerTitle}>المزيد</Text>
        <View style={styles.headerSpace} />
      </View>

      <View style={styles.moreContent}>
        <Pressable
          style={styles.supportCard}
          onPress={openSupportLogin}
        >
          <View style={styles.supportIcon}>
            <Text style={styles.supportIconText}>🛠️</Text>
          </View>

          <Text style={styles.supportTitle}>الدعم الفني</Text>

          <Text style={styles.supportSubtitle}>
            للاستفسار والمساعدة والتواصل مع فريق الدعم
          </Text>

          <Text style={styles.arrow}>‹</Text>
        </Pressable>
      </View>
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
    paddingTop: 35,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },

  headerSpace: {
    width: 42,
  },

  moreContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  supportCard: {
    minHeight: 170,
    backgroundColor: '#0D1B2A',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  supportIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#173B63',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  supportIconText: {
    fontSize: 30,
  },

  supportTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },

  supportSubtitle: {
    color: '#8FA3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },

  arrow: {
    position: 'absolute',
    left: 18,
    top: '50%',
    color: '#6F8498',
    fontSize: 34,
  },
});
