export type StatusBueiro = 'livre' | 'atencao' | 'critico';
export type Gravidade = 'leve' | 'moderada' | 'grave';
export type StatusOcorrencia = 'aberta' | 'em_analise' | 'resolvida';

export interface Bueiro {
  id: number;
  nome: string;
  latitude: number;
  longitude: number;
  nivel: number;
  status: StatusBueiro;
  ultima_leitura: string | null;
}

export interface Leitura {
  id_leitura: number;
  valor_leitura: number;
  unidade_medida: string;
  data_hora: string;
}

export interface BueiroDetalhe extends Bueiro {
  historico: Leitura[];
  foto_url: string | null;
}

export interface Ocorrencia {
  id: number;
  descricao: string | null;
  latitude: number;
  longitude: number;
  foto_url: string | null;
  gravidade: Gravidade;
  status: StatusOcorrencia;
  criado_em: string;
}

export interface NovaOcorrencia {
  descricao: string;
  latitude: number;
  longitude: number;
  gravidade: Gravidade;
}

export interface Resumo {
  bueiros_por_status: Record<StatusBueiro, number>;
  ocorrencias_por_status: Record<StatusOcorrencia, number>;
  ocorrencias_por_gravidade: Record<Gravidade, number>;
}

export interface Previsao {
  risco: 'baixo' | 'moderado' | 'alto';
  horas_estimadas: number | null;
  recomendacao: string;
}

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || ''
).replace(/\/+$/, '');
const TIMEOUT_MS = 8000;
const PREVISAO_TIMEOUT_MS = 60_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly network = false,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function requisicao<T>(
  caminho: string,
  init: RequestInit = {},
  timeoutMs = TIMEOUT_MS,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(
      'Configure EXPO_PUBLIC_API_URL com o endereço da API no arquivo .env.local.',
    );
  }

  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), timeoutMs);
  const cabecalhos = new Headers(init.headers);
  const corpoFormData =
    typeof FormData !== 'undefined' && init.body instanceof FormData;

  if (init.body && !corpoFormData && !cabecalhos.has('Content-Type')) {
    cabecalhos.set('Content-Type', 'application/json');
  }

  let resposta: Response;
  try {
    resposta = await fetch(`${API_BASE_URL}${caminho}`, {
      ...init,
      headers: cabecalhos,
      signal: controlador.signal,
    });
  } catch (erro) {
    const cancelada =
      controlador.signal.aborted ||
      (erro instanceof Error && erro.name === 'AbortError');
    const mensagem =
      erro instanceof Error ? erro.message : 'Falha de comunicação com a API.';
    throw new ApiError(
      cancelada
        ? 'A requisição excedeu o tempo limite.'
        : mensagem,
      true,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!resposta.ok) {
    let detalhe = `A API respondeu com HTTP ${resposta.status}.`;
    try {
      const corpo = (await resposta.json()) as { detail?: unknown };
      if (typeof corpo.detail === 'string') {
        detalhe = corpo.detail;
      } else if (corpo.detail !== undefined) {
        detalhe = JSON.stringify(corpo.detail);
      }
    } catch (erro) {
      if (!(erro instanceof SyntaxError)) {
        throw new ApiError('Não foi possível ler a resposta de erro da API.');
      }
    }
    throw new ApiError(detalhe, false, resposta.status);
  }

  return (await resposta.json()) as T;
}

export function listarBueiros(): Promise<Bueiro[]> {
  return requisicao<Bueiro[]>('/bueiros');
}

export function obterBueiro(id: number): Promise<BueiroDetalhe> {
  return requisicao<BueiroDetalhe>(`/bueiros/${id}`);
}

export function obterPrevisao(id: number): Promise<Previsao> {
  return requisicao<Previsao>(
    `/bueiros/${id}/previsao`,
    {},
    PREVISAO_TIMEOUT_MS,
  );
}

export function listarOcorrencias(): Promise<Ocorrencia[]> {
  return requisicao<Ocorrencia[]>('/ocorrencias');
}

export function obterResumo(): Promise<Resumo> {
  return requisicao<Resumo>('/resumo');
}

export function verificarSaude(): Promise<{ status: string }> {
  return requisicao<{ status: string }>('/saude');
}

export function criarOcorrencia(
  dados: NovaOcorrencia,
): Promise<Ocorrencia> {
  return requisicao<Ocorrencia>('/ocorrencias', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export async function enviarFotoOcorrencia(
  id: number,
  uri: string,
  tipo: string,
): Promise<Ocorrencia> {
  const formulario = new FormData();
  const extensao = tipo === 'image/png' ? 'png' : 'jpg';
  const arquivo = {
    uri,
    name: `denuncia.${extensao}`,
    type: tipo || 'image/jpeg',
  };
  formulario.append('foto', arquivo as unknown as Blob);

  return requisicao<Ocorrencia>(`/ocorrencias/${id}/foto`, {
    method: 'POST',
    body: formulario,
  });
}

export function urlDaImagem(caminho: string | null): string | null {
  if (!caminho) return null;
  return caminho.startsWith('http')
    ? caminho
    : `${API_BASE_URL}${caminho.startsWith('/') ? '' : '/'}${caminho}`;
}
