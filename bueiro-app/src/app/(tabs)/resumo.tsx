import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorBanner } from '../../components/ErrorBanner';
import { Carregando, ListaVazia } from '../../components/Estados';
import { Screen } from '../../components/Screen';
import { cores } from '../../constants/theme';
import { usePolling } from '../../hooks/usePolling';
import { obterResumo } from '../../services/api';

export default function ResumoScreen() {
  const carregar = useCallback(() => obterResumo(), []);
  const { dados, carregando, desatualizado, erro } = usePolling(
    '@bueiro-inteligente/resumo',
    carregar,
  );
  const grupos = dados
    ? [
        {
          titulo: 'Bueiros por status',
          cor: cores.livre,
          valores: [
            ['Livre', dados.bueiros_por_status.livre],
            ['Atenção', dados.bueiros_por_status.atencao],
            ['Crítico', dados.bueiros_por_status.critico],
          ],
        },
        {
          titulo: 'Alagamentos por status',
          cor: cores.ocorrencia,
          valores: [
            ['Aberta', dados.ocorrencias_por_status.aberta],
            ['Em análise', dados.ocorrencias_por_status.em_analise],
            ['Resolvida', dados.ocorrencias_por_status.resolvida],
          ],
        },
        {
          titulo: 'Alagamentos por gravidade',
          cor: cores.critico,
          valores: [
            ['Leve', dados.ocorrencias_por_gravidade.leve],
            ['Moderada', dados.ocorrencias_por_gravidade.moderada],
            ['Grave', dados.ocorrencias_por_gravidade.grave],
          ],
        },
      ]
    : [];

  return (
    <Screen
      titulo="Resumo"
      subtitulo="Situação atual do monitoramento e das denúncias"
    >
      <ErrorBanner mensagem={desatualizado ? erro : null} />
      {carregando && !dados ? (
        <Carregando />
      ) : !dados ? (
        <ListaVazia texto="O resumo ainda não está disponível." />
      ) : (
        <ScrollView contentContainerStyle={styles.lista}>
          {grupos.map((grupo) => (
            <View key={grupo.titulo} style={styles.cartao}>
              <View style={styles.cabecalhoCartao}>
                <View style={[styles.marcador, { backgroundColor: grupo.cor }]} />
                <Text style={styles.tituloCartao}>{grupo.titulo}</Text>
              </View>
              {grupo.valores.map(([rotulo, valor]) => (
                <View key={rotulo} style={styles.linha}>
                  <Text style={styles.rotulo}>{rotulo}</Text>
                  <Text style={[styles.valor, { color: grupo.cor }]}>{valor}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lista: { gap: 14, paddingBottom: 24 },
  cartao: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#173126',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.045,
    shadowRadius: 8,
    elevation: 1,
  },
  cabecalhoCartao: { alignItems: 'center', flexDirection: 'row', gap: 9, marginBottom: 8 },
  marcador: { borderRadius: 99, height: 9, width: 9 },
  tituloCartao: {
    color: cores.texto,
    fontSize: 16,
    fontWeight: '800',
  },
  linha: {
    alignItems: 'center',
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  rotulo: { color: cores.textoSecundario, fontSize: 14 },
  valor: { fontSize: 19, fontWeight: '800' },
});
