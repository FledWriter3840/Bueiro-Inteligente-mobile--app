import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { cores } from '../constants/theme';

export function Carregando({ texto = 'Carregando dados...' }: { texto?: string }) {
  return (
    <View style={styles.estado}>
      <ActivityIndicator color={cores.primario} size="large" />
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}

export function ListaVazia({ texto }: { texto: string }) {
  return (
    <View style={styles.vazio}>
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  estado: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  vazio: { alignItems: 'center', padding: 28 },
  texto: { color: cores.textoSecundario, fontSize: 14, textAlign: 'center' },
});
