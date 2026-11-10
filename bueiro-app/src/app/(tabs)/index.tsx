import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';

import { ErrorBanner } from '../../components/ErrorBanner';
import { Carregando } from '../../components/Estados';
import { MapWebView } from '../../components/MapWebView';
import { Screen } from '../../components/Screen';
import { useCriticalAlerts } from '../../hooks/useCriticalAlerts';
import { usePolling } from '../../hooks/usePolling';
import {
  listarBueiros,
  listarOcorrencias,
  obterPrevisao,
  verificarSaude,
  Bueiro,
  Ocorrencia,
  Previsao,
} from '../../services/api';

interface DadosMapa {
  bueiros: Bueiro[];
  ocorrencias: Ocorrencia[];
}

interface Coordenadas {
  latitude: number;
  longitude: number;
}

function distanciaEmMetros(
  origem: Coordenadas,
  destino: Coordenadas,
): number {
  const radianos = Math.PI / 180;
  const latitudeOrigem = origem.latitude * radianos;
  const latitudeDestino = destino.latitude * radianos;
  const diferencaLatitude = (destino.latitude - origem.latitude) * radianos;
  const diferencaLongitude = (destino.longitude - origem.longitude) * radianos;
  const a =
    Math.sin(diferencaLatitude / 2) ** 2 +
    Math.cos(latitudeOrigem) *
      Math.cos(latitudeDestino) *
      Math.sin(diferencaLongitude / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapaScreen() {
  const [localizacao, setLocalizacao] = useState<Coordenadas | null>(null);
  const [erroLocalizacao, setErroLocalizacao] = useState<string | null>(null);
  const [risco, setRisco] = useState<Previsao['risco'] | null>(null);
  const [carregandoRisco, setCarregandoRisco] = useState(false);
  const [erroRisco, setErroRisco] = useState<string | null>(null);
  const carregar = useCallback(async (): Promise<DadosMapa> => {
    await verificarSaude();
    const [bueiros, ocorrencias] = await Promise.all([
      listarBueiros(),
      listarOcorrencias(),
    ]);
    return { bueiros, ocorrencias };
  }, []);
  const { dados, carregando, desatualizado, erro } = usePolling(
    '@bueiro-inteligente/mapa',
    carregar,
    10_000,
  );
  useCriticalAlerts(dados?.bueiros ?? null);
  const dadosDisponiveis = dados !== null;
  const bueiroMaisProximoId = useMemo(() => {
    if (!localizacao || !dados?.bueiros.length) return null;
    return dados.bueiros.reduce((maisProximo, bueiro) =>
      distanciaEmMetros(localizacao, bueiro) <
      distanciaEmMetros(localizacao, maisProximo)
        ? bueiro
        : maisProximo,
    ).id;
  }, [dados?.bueiros, localizacao]);

  useEffect(() => {
    let ativo = true;

    async function carregarLocalizacao() {
      try {
        const permissao = await Location.requestForegroundPermissionsAsync();
        if (permissao.status !== 'granted') {
          throw new Error('Permita o acesso à localização para centralizar o mapa.');
        }
        const posicao = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (ativo) {
          setLocalizacao({
            latitude: posicao.coords.latitude,
            longitude: posicao.coords.longitude,
          });
        }
      } catch (falha) {
        if (ativo) {
          setErroLocalizacao(
            falha instanceof Error
              ? falha.message
              : 'Não foi possível obter sua localização.',
          );
        }
      }
    }

    void carregarLocalizacao();
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!localizacao || !dadosDisponiveis) return;
    if (bueiroMaisProximoId === null) {
      setRisco(null);
      setCarregandoRisco(false);
      setErroRisco('Não há bueiros disponíveis para estimar o risco nesta área.');
      return;
    }

    let ativo = true;
    setRisco(null);
    setErroRisco(null);
    setCarregandoRisco(true);
    void obterPrevisao(bueiroMaisProximoId)
      .then((previsao) => {
        if (ativo) setRisco(previsao.risco);
      })
      .catch((falha: unknown) => {
        if (ativo) {
          setErroRisco(
            falha instanceof Error
              ? falha.message
              : 'Não foi possível consultar o risco da área.',
          );
        }
      })
      .finally(() => {
        if (ativo) setCarregandoRisco(false);
      });

    return () => {
      ativo = false;
    };
  }, [bueiroMaisProximoId, dadosDisponiveis, localizacao]);

  return (
    <Screen
      titulo="Mapa"
      subtitulo="Sua localização e risco estimado pelo bueiro mais próximo"
    >
      <ErrorBanner mensagem={desatualizado ? erro : null} />
      <ErrorBanner
        mensagem={erroLocalizacao}
        titulo="Não foi possível obter sua localização"
      />
      <ErrorBanner
        mensagem={erroRisco}
        titulo="Não foi possível estimar o risco da área"
      />
      {carregando && !dados ? (
        <Carregando />
      ) : (
        <View style={styles.mapa}>
          <MapWebView
            bueiros={dados?.bueiros ?? []}
            ocorrencias={dados?.ocorrencias ?? []}
            localizacao={localizacao}
            risco={risco}
            carregandoRisco={carregandoRisco}
            aoAbrirBueiro={(id) =>
              router.push({ pathname: '/bueiro/[id]', params: { id: String(id) } })
            }
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapa: {
    borderColor: '#d8e3d8',
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
});
