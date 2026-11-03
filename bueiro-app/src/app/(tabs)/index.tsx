import { useCallback } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ErrorBanner } from '../../components/ErrorBanner';
import { Carregando } from '../../components/Estados';
import { MapWebView } from '../../components/MapWebView';
import { Screen } from '../../components/Screen';
import { useCriticalAlerts } from '../../hooks/useCriticalAlerts';
import { usePolling } from '../../hooks/usePolling';
import {
  listarBueiros,
  listarOcorrencias,
  verificarSaude,
  Bueiro,
  Ocorrencia,
} from '../../services/api';

interface DadosMapa {
  bueiros: Bueiro[];
  ocorrencias: Ocorrencia[];
}

export default function MapaScreen() {
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

  return (
    <Screen
      titulo="Mapa"
      subtitulo="Bueiros e pontos de alagamento em São Paulo"
    >
      <ErrorBanner mensagem={desatualizado ? erro : null} />
      {carregando && !dados ? (
        <Carregando />
      ) : (
        <View style={styles.mapa}>
          <MapWebView
            bueiros={dados?.bueiros ?? []}
            ocorrencias={dados?.ocorrencias ?? []}
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
