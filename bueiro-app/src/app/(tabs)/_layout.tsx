import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { cores } from '../../constants/theme';

const icones: Record<string, string> = {
  index: '⌖',
  lista: '☷',
  denunciar: '+',
  resumo: '▥',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.primario,
        tabBarInactiveTintColor: '#829087',
        tabBarStyle: styles.barra,
        tabBarLabelStyle: styles.rotulo,
        tabBarItemStyle: styles.item,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.icone, focused && styles.iconeAtivo]}>
              <Text style={[styles.glyph, { color }]}>{icones.index}</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="lista"
        options={{
          title: 'Bueiros',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.icone, focused && styles.iconeAtivo]}>
              <Text style={[styles.glyph, { color }]}>{icones.lista}</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="denunciar"
        options={{
          title: 'Denunciar',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.icone, styles.iconeDenuncia, focused && styles.iconeDenunciaAtivo]}>
              <Text style={[styles.glyph, styles.glyphDenuncia]}>
                {icones.denunciar}
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="resumo"
        options={{
          title: 'Resumo',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.icone, focused && styles.iconeAtivo]}>
              <Text style={[styles.glyph, { color }]}>{icones.resumo}</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barra: {
    backgroundColor: cores.superficie,
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    elevation: 12,
    height: 68,
    paddingBottom: 6,
    paddingTop: 7,
  },
  item: { gap: 2 },
  rotulo: { fontSize: 10, fontWeight: '700' },
  icone: {
    alignItems: 'center',
    borderRadius: 12,
    height: 28,
    justifyContent: 'center',
    width: 42,
  },
  iconeAtivo: { backgroundColor: '#e9f4e8' },
  glyph: { fontSize: 21, fontWeight: '700', lineHeight: 24 },
  iconeDenuncia: { backgroundColor: cores.primario, borderRadius: 15, height: 30 },
  iconeDenunciaAtivo: { backgroundColor: cores.cabecalho },
  glyphDenuncia: { color: '#ffffff', fontSize: 23, lineHeight: 26 },
});
