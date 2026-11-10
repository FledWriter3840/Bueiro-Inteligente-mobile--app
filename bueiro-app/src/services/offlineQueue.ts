import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ApiError,
  criarOcorrencia,
  enviarFotoOcorrencia,
  NovaOcorrencia,
} from './api';

const CHAVE_FILA = '@bueiro-inteligente/denuncias-pendentes';
let envioFilaEmAndamento: Promise<void> | null = null;

interface DenunciaPendente {
  id: string;
  dados: NovaOcorrencia;
  fotoUri: string | null;
  fotoTipo: string;
  ocorrenciaId?: number;
}

async function lerFila(): Promise<DenunciaPendente[]> {
  const armazenado = await AsyncStorage.getItem(CHAVE_FILA);
  if (!armazenado) return [];

  try {
    const fila = JSON.parse(armazenado) as DenunciaPendente[];
    if (!Array.isArray(fila)) {
      throw new Error('A fila local de denúncias não é uma lista.');
    }
    return fila;
  } catch (erro) {
    if (erro instanceof SyntaxError) {
      throw new Error('Não foi possível interpretar a fila local de denúncias.');
    }
    throw erro;
  }
}

async function salvarFila(fila: DenunciaPendente[]): Promise<void> {
  await AsyncStorage.setItem(CHAVE_FILA, JSON.stringify(fila));
}

export async function quantidadeDenunciasPendentes(): Promise<number> {
  return (await lerFila()).length;
}

export async function enviarOuEnfileirarDenuncia(
  dados: NovaOcorrencia,
  fotoUri: string | null,
  fotoTipo: string,
): Promise<'enviada' | 'pendente'> {
  const fila = await lerFila();
  const pendente: DenunciaPendente = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    dados,
    fotoUri,
    fotoTipo,
  };
  fila.push(pendente);
  await salvarFila(fila);

  try {
    await reenviarDenunciasPendentes();
    return (await lerFila()).some((item) => item.id === pendente.id)
      ? 'pendente'
      : 'enviada';
  } catch (erro) {
    if (erro instanceof ApiError && erro.network) {
      return 'pendente';
    }
    throw erro;
  }
}

export function reenviarDenunciasPendentes(): Promise<void> {
  if (envioFilaEmAndamento) return envioFilaEmAndamento;

  envioFilaEmAndamento = processarFila().finally(() => {
    envioFilaEmAndamento = null;
  });
  return envioFilaEmAndamento;
}

async function processarFila(): Promise<void> {
  const fila = await lerFila();
  while (fila.length > 0) {
    await enviarPendente(fila[0], fila);
  }
}

async function enviarPendente(
  pendente: DenunciaPendente,
  fila: DenunciaPendente[],
): Promise<void> {
  if (!pendente.ocorrenciaId) {
    const criada = await criarOcorrencia(pendente.dados);
    pendente.ocorrenciaId = criada.id;
    // Guarda o identificador antes do upload para não duplicar a denúncia no reenvio.
    await salvarFila(fila);
  }

  if (pendente.fotoUri) {
    await enviarFotoOcorrencia(
      pendente.ocorrenciaId,
      pendente.fotoUri,
      pendente.fotoTipo,
    );
  }

  const indice = fila.findIndex((item) => item.id === pendente.id);
  if (indice >= 0) {
    fila.splice(indice, 1);
    await salvarFila(fila);
  }
}
