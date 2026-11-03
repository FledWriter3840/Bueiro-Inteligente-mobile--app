import { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

import { cores } from '../constants/theme';

export function Screen({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  return (
    <SafeAreaView edges={['top']} style={styles.tela}>
      <View style={styles.cabecalho}>
        <Text style={styles.marca}>BUEIRO INTELIGENTE</Text>
        <Text style={styles.titulo}>{titulo}</Text>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
      </View>
      <View style={styles.conteudo}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { backgroundColor: cores.fundo, flex: 1 },
  cabecalho: {
    backgroundColor: cores.cabecalho,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 20,
  },
  marca: {
    color: cores.destaque,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 7,
  },
  titulo: { color: '#ffffff', fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  subtitulo: { color: '#c4d8cb', fontSize: 13, lineHeight: 19, marginTop: 5 },
  conteudo: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
});
