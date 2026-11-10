import { StyleSheet, Text, View } from 'react-native';

import { cores } from '../constants/theme';
import { StatusBueiro } from '../services/api';

const rotulos: Record<StatusBueiro, string> = {
  livre: 'Livre',
  atencao: 'Atenção',
  critico: 'Crítico',
};

const coresStatus: Record<StatusBueiro, string> = {
  livre: '#e5f4e9',
  atencao: '#fff2d8',
  critico: '#fde8e5',
};

const coresTextoStatus: Record<StatusBueiro, string> = {
  livre: cores.livre,
  atencao: cores.atencao,
  critico: cores.critico,
};

export function StatusBadge({ status }: { status: StatusBueiro }) {
  return (
    <View style={[styles.base, { backgroundColor: coresStatus[status] }]}>
      <Text style={[styles.texto, { color: coresTextoStatus[status] }]}>
        {rotulos[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: 99,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  texto: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
});
