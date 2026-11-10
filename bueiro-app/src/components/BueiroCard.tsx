import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from '../constants/theme';
import { Bueiro } from '../services/api';
import { StatusBadge } from './StatusBadge';

export function BueiroCard({
  bueiro,
  onPress,
}: {
  bueiro: Bueiro;
  onPress: () => void;
}) {
  const nivel = Math.max(0, Math.min(100, bueiro.nivel));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.cartao,
        pressed && styles.pressionado,
      ]}
    >
      <View style={styles.cabecalho}>
        <View>
          <Text style={styles.nome}>{bueiro.nome}</Text>
          <Text style={styles.subtitulo}>Prioridade de limpeza</Text>
        </View>
        <StatusBadge status={bueiro.status} />
      </View>
      <View style={styles.nivelLinha}>
        <Text style={styles.rotuloNivel}>Nível atual</Text>
        <Text style={styles.valorNivel}>{Math.round(nivel)}%</Text>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: nivel }}
        style={styles.trilho}
      >
        <View
          style={[
            styles.progresso,
            {
              width: `${nivel}%`,
              backgroundColor:
                bueiro.status === 'critico'
                  ? cores.critico
                  : bueiro.status === 'atencao'
                    ? cores.atencao
                    : cores.livre,
            },
          ]}
        />
      </View>
      <Text style={styles.horario}>
        Última leitura:{' '}
        {bueiro.ultima_leitura ?? 'sem leituras'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
    shadowColor: '#173126',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.045,
    shadowRadius: 8,
    elevation: 1,
  },
  pressionado: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  cabecalho: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nome: { color: cores.texto, fontSize: 17, fontWeight: '800' },
  subtitulo: { color: cores.textoSecundario, fontSize: 12, marginTop: 4 },
  nivelLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  rotuloNivel: { color: cores.textoSecundario, fontSize: 13 },
  valorNivel: { color: cores.texto, fontSize: 15, fontWeight: '700' },
  trilho: {
    backgroundColor: '#e8efe7',
    borderRadius: 99,
    height: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  progresso: { borderRadius: 99, height: '100%' },
  horario: { color: cores.textoSecundario, fontSize: 12, marginTop: 13 },
});
