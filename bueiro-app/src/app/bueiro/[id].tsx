import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ErrorBanner } from '../../components/ErrorBanner';
import { Carregando, ListaVazia } from '../../components/Estados';
import { Screen } from '../../components/Screen';
import { StatusBadge } from '../../components/StatusBadge';
import { cores } from '../../constants/theme';
import { usePolling } from '../../hooks/usePolling';
import {
  obterBueiro,
  obterPrevisao,
  Previsao,
  urlDaImagem,
} from '../../services/api';

export default function BueiroDetalheScreen() {
  const { id: idParametro } = useLocalSearchParams<{ id: string }>();
  const id = Number(idParametro);
  const carregar = useCallback(() => obterBueiro(id), [id]);
  const { dados, carregando, desatualizado, erro, atualizar } = usePolling(
    `@bueiro-inteligente/bueiro-${id}`,
    carregar,
  );
  const [previsao, setPrevisao] = useState<Previsao | null>(null);
  const [carregandoPrevisao, setCarregandoPrevisao] = useState(true);
  const [erroPrevisao, setErroPrevisao] = useState<string | null>(null);
  const [fotoComErro, setFotoComErro] = useState(false);

  const carregarPrevisao = useCallback(async () => {
    try {
      setErroPrevisao(null);
      setPrevisao(await obterPrevisao(id));
    } catch (falha) {
      setErroPrevisao(
        falha instanceof Error
          ? falha.message
          : 'Não foi possível carregar a previsão.',
      );
    } finally {
      setCarregandoPrevisao(false);
    }
  }, [id]);

  useEffect(() => {
    void carregarPrevisao();
  }, [carregarPrevisao]);

  const imagem = urlDaImagem(dados?.foto_url ?? null);

  return (
    <Screen titulo={`Bueiro ${id}`} subtitulo="Detalhes do monitoramento">
      <ScrollView contentContainerStyle={styles.conteudo}>
        <Pressable onPress={() => router.back()} style={styles.voltar}>
          <Text style={styles.link}>‹ Voltar</Text>
        </Pressable>
        <ErrorBanner mensagem={desatualizado ? erro : null} />
        {carregando && !dados ? (
          <Carregando />
        ) : dados ? (
          <>
            <View style={styles.cartao}>
              <View style={styles.linha}>
                <Text style={styles.nivel}>{Math.round(dados.nivel)}%</Text>
                <StatusBadge status={dados.status} />
              </View>
              <Text style={styles.subtitulo}>Nível atual indicado pelo sensor</Text>
              <Text style={styles.metadado}>
                Última leitura: {dados.ultima_leitura ?? 'sem leituras'}
              </Text>
              <Pressable onPress={() => void atualizar()} style={styles.acaoSecundaria}>
                <Text style={styles.link}>Atualizar dados</Text>
              </Pressable>
            </View>

            <View style={styles.cartao}>
              <Text style={styles.tituloCartao}>Previsão da IA</Text>
              {carregandoPrevisao ? (
                <Carregando texto="Consultando o modelo de risco..." />
              ) : erroPrevisao ? (
                <Text style={styles.erro}>{erroPrevisao}</Text>
              ) : previsao ? (
                <>
                  <Text style={styles.valorPrevisao}>
                    Risco {previsao.risco}
                    {previsao.horas_estimadas !== null
                      ? ` · ${previsao.horas_estimadas} h estimadas`
                      : ''}
                  </Text>
                  <Text style={styles.metadado}>{previsao.recomendacao}</Text>
                </>
              ) : null}
              <Pressable
                onPress={() => {
                  setCarregandoPrevisao(true);
                  void carregarPrevisao();
                }}
                style={styles.acaoSecundaria}
              >
                <Text style={styles.link}>Atualizar previsão</Text>
              </Pressable>
            </View>

            <View style={styles.cartao}>
              <Text style={styles.tituloCartao}>Foto mais recente</Text>
              {imagem && !fotoComErro ? (
                <Image
                  accessibilityLabel="Foto mais recente do bueiro"
                  source={{ uri: imagem }}
                  onError={() => setFotoComErro(true)}
                  style={styles.foto}
                />
              ) : (
                <ListaVazia texto="Nenhuma foto disponível para este bueiro." />
              )}
            </View>

            <View style={styles.cartao}>
              <Text style={styles.tituloCartao}>Leituras recentes</Text>
              {dados.historico.length === 0 ? (
                <ListaVazia texto="Ainda não há histórico de leituras." />
              ) : (
                dados.historico.map((leitura) => (
                  <View key={leitura.id_leitura} style={styles.leitura}>
                    <Text style={styles.valorLeitura}>
                      {leitura.valor_leitura} {leitura.unidade_medida}
                    </Text>
                    <Text style={styles.metadado}>{leitura.data_hora}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <ListaVazia texto="Não foi possível encontrar este bueiro." />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  conteudo: { gap: 12, paddingBottom: 28 },
  voltar: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5eee4',
    borderRadius: 99,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  link: { color: cores.primario, fontSize: 14, fontWeight: '700' },
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
  linha: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nivel: { color: cores.texto, fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  subtitulo: { color: cores.textoSecundario, fontSize: 13, marginTop: 4 },
  metadado: { color: cores.textoSecundario, fontSize: 13, marginTop: 8 },
  acaoSecundaria: { alignSelf: 'flex-start', marginTop: 12 },
  tituloCartao: {
    color: cores.texto,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  valorPrevisao: {
    backgroundColor: '#eaf4e8',
    borderRadius: 12,
    color: cores.primario,
    fontSize: 17,
    fontWeight: '800',
    overflow: 'hidden',
    padding: 12,
  },
  erro: { color: cores.critico, fontSize: 13, lineHeight: 19 },
  foto: { borderRadius: 16, height: 190, width: '100%' },
  leitura: {
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  valorLeitura: { color: cores.texto, fontSize: 15, fontWeight: '700' },
});
