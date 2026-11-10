import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

import { Bueiro } from '../services/api';

const CHAVE_STATUS = '@bueiro-inteligente/status-anterior';

export function useCriticalAlerts(bueiros: Bueiro[] | null): void {
  const processando = useRef(false);

  useEffect(() => {
    if (!bueiros || processando.current) return;
    processando.current = true;

    void (async () => {
      try {
        const anteriorArmazenado = await AsyncStorage.getItem(CHAVE_STATUS);
        const anterior = anteriorArmazenado
          ? (JSON.parse(anteriorArmazenado) as Record<string, string>)
          : {};
        const novasCriticas = bueiros.filter(
          (bueiro) =>
            Object.prototype.hasOwnProperty.call(anterior, String(bueiro.id)) &&
            anterior[String(bueiro.id)] !== 'critico' &&
            bueiro.status === 'critico',
        );
        let notificacoesPermitidas = false;
        if (novasCriticas.length > 0) {
          const permissao = await Notifications.getPermissionsAsync();
          notificacoesPermitidas =
            permissao.granted ||
            (await Notifications.requestPermissionsAsync()).granted;
        }

        for (const bueiro of bueiros) {
          if (
            notificacoesPermitidas &&
            bueiro.status === 'critico' &&
            anterior[String(bueiro.id)] !== 'critico'
          ) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Bueiro em nível crítico',
                body: `${bueiro.nome} atingiu ${Math.round(bueiro.nivel)}% de nível.`,
              },
              trigger: null,
            });
          }
          anterior[String(bueiro.id)] = bueiro.status;
          await AsyncStorage.setItem(CHAVE_STATUS, JSON.stringify(anterior));
        }
      } catch (erro) {
        console.warn('Não foi possível processar o alerta de nível crítico.', erro);
      } finally {
        processando.current = false;
      }
    })();
  }, [bueiros]);
}
