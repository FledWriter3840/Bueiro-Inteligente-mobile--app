import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '../services/api';
import { reenviarDenunciasPendentes } from '../services/offlineQueue';

interface EstadoPolling<T> {
  dados: T | null;
  carregando: boolean;
  desatualizado: boolean;
  erro: string | null;
  atualizar: () => Promise<void>;
}

export function usePolling<T>(
  chaveCache: string,
  carregar: () => Promise<T>,
  intervaloMs = 10_000,
): EstadoPolling<T> {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [desatualizado, setDesatualizado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const atualizar = useCallback(async () => {
    try {
      const atuais = await carregar();
      setDados(atuais);
      setDesatualizado(false);
      setErro(null);
      setCarregando(false);
      try {
        await AsyncStorage.setItem(chaveCache, JSON.stringify(atuais));
      } catch (falhaCache) {
        console.warn('Não foi possível salvar o cache local.', falhaCache);
      }
      try {
        await reenviarDenunciasPendentes();
      } catch (falhaFila) {
        console.warn('Não foi possível reenviar uma denúncia pendente.', falhaFila);
      }
    } catch (falhaApi) {
      setDesatualizado(true);
      setErro(
        falhaApi instanceof ApiError
          ? falhaApi.message
          : 'Não foi possível atualizar os dados.',
      );
      setCarregando(false);
    }
  }, [carregar, chaveCache]);

  useEffect(() => {
    let ativo = true;

    AsyncStorage.getItem(chaveCache)
      .then((armazenado) => {
        if (ativo && armazenado) setDados(JSON.parse(armazenado) as T);
      })
      .catch((falhaCache) => {
        console.warn('Não foi possível recuperar o cache local.', falhaCache);
      });

    void atualizar();
    const temporizador = setInterval(() => void atualizar(), intervaloMs);
    return () => {
      ativo = false;
      clearInterval(temporizador);
    };
  }, [atualizar, chaveCache, intervaloMs]);

  return { dados, carregando, desatualizado, erro, atualizar };
}
