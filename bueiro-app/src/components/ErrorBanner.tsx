import { StyleSheet, Text, View } from 'react-native';

export function ErrorBanner({
  mensagem,
  titulo = 'Dados desatualizados: sem conexão com o servidor',
}: {
  mensagem?: string | null;
  titulo?: string;
}) {
  if (!mensagem) return null;

  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.detalhe}>{mensagem}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff4ed',
    borderColor: '#f0d0bd',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  titulo: { color: '#813a1d', fontSize: 13, fontWeight: '800' },
  detalhe: { color: '#90553a', fontSize: 12, lineHeight: 18, marginTop: 5 },
});
