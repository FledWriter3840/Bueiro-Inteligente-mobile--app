import { useCallback, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';

import { BueiroCard } from '../../components/BueiroCard';
import { ErrorBanner } from '../../components/ErrorBanner';
import { Carregando, ListaVazia } from '../../components/Estados';
import { Screen } from '../../components/Screen';
import { usePolling } from '../../hooks/usePolling';
import { listarBueiros } from '../../services/api';

export default function ListaScreen() {
  const carregar = useCallback(() => listarBueiros(), []);
  const { dados, carregando, desatualizado, erro, atualizar } = usePolling(
    '@bueiro-inteligente/lista-bueiros',
    carregar,
  );
  const [atualizando, setAtualizando] = useState(false);

  async function atualizarLista() {
    setAtualizando(true);
    try {
      await atualizar();
    } finally {
      setAtualizando(false);
    }
  }

  const ordenados = [...(dados ?? [])].sort((a, b) => b.nivel - a.nivel);

  return (
    <Screen
      titulo="Bueiros"
      subtitulo="Nível mais alto aparece primeiro para priorizar a limpeza"
    >
      <FlatList
        data={ordenados}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <BueiroCard
            bueiro={item}
            onPress={() =>
              router.push({
                pathname: '/bueiro/[id]',
                params: { id: String(item.id) },
              })
            }
          />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizarLista}
            tintColor="#146c50"
          />
        }
        ListHeaderComponent={
          <ErrorBanner mensagem={desatualizado ? erro : null} />
        }
        ListEmptyComponent={
          carregando ? (
            <Carregando />
          ) : (
            <ListaVazia texto="Nenhum bueiro monitorado foi encontrado." />
          )
        }
      />
    </Screen>
  );
}
