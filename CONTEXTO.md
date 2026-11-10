# Contexto do projeto — Bueiro Inteligente

Este documento apresenta o contexto funcional e técnico do aplicativo móvel
para pessoas que vão desenvolver, revisar ou utilizar assistentes de IA neste
repositório. Ele descreve o estado observado no código; quando houver dúvida,
confira os arquivos-fonte citados abaixo, pois eles prevalecem sobre este
resumo.

## Visão geral

O **Bueiro Inteligente** é um aplicativo Expo/React Native para monitoramento de
bueiros e registro comunitário de alagamentos. Ele consome uma API separada do
projeto de TCC:

- Repositório da API e do projeto relacionado:
  [Bueiro-Inteligente-IoT-TCC](https://github.com/FledWriter3840/Bueiro-Inteligente-IoT-TCC)
- A API deve estar acessível na rede para o app buscar dados ou sincronizar
  denúncias. O aplicativo não contém o backend nem a migração de banco de dados.
- A documentação de execução voltada a quem usa o app está em
  [bueiro-app/README.md](./bueiro-app/README.md).

## Funcionalidades

O app tem quatro áreas principais, acessíveis pelas abas:

1. **Mapa** (`src/app/(tabs)/index.tsx`): mostra bueiros e ocorrências no
   Leaflet, com tiles do OpenStreetMap. A localização do aparelho centraliza o
   mapa; o risco estimado vem da previsão do bueiro monitorado mais próximo.
   Tocar em um bueiro permite abrir seu detalhe.
2. **Bueiros** (`src/app/(tabs)/lista.tsx`): lista os bueiros, ordenados pelo
   nível medido do maior para o menor, com atualização manual.
3. **Denunciar** (`src/app/(tabs)/denunciar.tsx`): registra a gravidade,
   descrição e localização de um alagamento; a foto é opcional e pode vir da
   câmera ou galeria.
4. **Resumo** (`src/app/(tabs)/resumo.tsx`): apresenta contagens de bueiros por
   status e ocorrências por status e gravidade.

O detalhe de cada bueiro (`src/app/bueiro/[id].tsx`) mostra nível, status,
última leitura, leituras recentes, foto mais recente e previsão de risco.

### Estados e valores usados pela aplicação

- Status do bueiro: `livre`, `atencao`, `critico`.
- Gravidade da ocorrência: `leve`, `moderada`, `grave`.
- Status da ocorrência: `aberta`, `em_analise`, `resolvida`.
- Risco previsto: `baixo`, `moderado`, `alto`; o número de horas estimadas pode
  ser nulo.

Os tipos compartilhados com a camada HTTP estão definidos em
`bueiro-app/src/services/api.ts`.

## Arquitetura e organização

O código do aplicativo fica em `bueiro-app/`:

- `src/app/`: telas e rotas do Expo Router; `_layout.tsx` configura a navegação
  raiz e `(tabs)/_layout.tsx` configura as abas.
- `src/components/`: componentes visuais reutilizados, incluindo o mapa,
  cartões, estados de carregamento e mensagens de erro.
- `src/services/api.ts`: tipos da API, funções HTTP, tratamento de timeout e
  construção de URLs para imagens.
- `src/services/offlineQueue.ts`: fila persistente local para denúncias
  pendentes.
- `src/hooks/usePolling.ts`: busca periódica, cache local e tentativa de
  sincronizar a fila.
- `src/hooks/useCriticalAlerts.ts`: alertas locais quando um bueiro passa a
  estado crítico.
- `src/constants/theme.ts`: cores e tokens visuais.

As telas devem permanecer em `src/app/`; código reutilizável deve ficar fora
desse diretório para não criar rotas involuntárias.

## Integração com a API

Configure `EXPO_PUBLIC_API_URL` no arquivo local `bueiro-app/.env.local`, sem
barra final. Em dispositivo físico, use um endereço acessível pela rede Wi-Fi
do aparelho, não `localhost`. O arquivo `bueiro-app/.env.example` contém
somente um exemplo; não copie nem publique valores de `.env.local`.

O cliente HTTP usa timeout padrão de 8 segundos e 60 segundos para a previsão.
Os caminhos consumidos pelo app são:

| Método | Caminho | Uso |
|---|---|---|
| `GET` | `/saude` | Verificação da API usada na tela do mapa |
| `GET` | `/bueiros` | Lista de bueiros |
| `GET` | `/bueiros/{id}` | Detalhe, leituras e foto de um bueiro |
| `GET` | `/bueiros/{id}/previsao` | Previsão de risco |
| `GET` | `/ocorrencias` | Lista de alagamentos |
| `GET` | `/resumo` | Contagens agregadas |
| `POST` | `/ocorrencias` | Criação de denúncia |
| `POST` | `/ocorrencias/{id}/foto` | Envio da foto de uma denúncia criada |

O formato detalhado dos contratos deve ser confirmado no backend. Os tipos
esperados pelo app estão declarados em `bueiro-app/src/services/api.ts`.

## Comportamentos importantes

- As telas que usam `usePolling` atualizam os dados periodicamente; o intervalo
  padrão é 10 segundos. A tela do mapa solicita primeiro o endpoint de saúde e
  carrega bueiros e ocorrências em paralelo.
- Os dados mais recentes são guardados no AsyncStorage para permitir mostrar
  conteúdo em cache durante indisponibilidade da API. Erros de atualização são
  exibidos como dados desatualizados quando já existe cache.
- Denúncias são persistidas localmente antes do envio. Se a comunicação falhar
  por rede, a tela informa que a denúncia está pendente. O app tenta reenviar a
  fila quando consegue atualizar dados. O ID retornado pela API é guardado
  antes do upload da foto para evitar criar outra denúncia numa tentativa
  posterior.
- Alertas locais são destinados a mudanças de status para `critico`. O app
  solicita permissão quando necessário. Notificações push remotas não são
  suportadas no Expo Go para Android.
- O mapa depende de internet para obter os tiles do OpenStreetMap e carregar
  Leaflet via CDN. O centro inicial padrão do mapa é São Paulo; com permissão
  de localização, ele é centralizado na posição atual.

## Tecnologias e comandos

O projeto usa Expo SDK 58, React Native 0.88, React 19 e TypeScript 6. As
dependências e scripts estão em `bueiro-app/package.json`.

No PowerShell, a partir de `bueiro-app`:

```powershell
npm install
npx expo start --clear --lan
```

Comandos de validação disponíveis:

```powershell
npm run lint
npm run typecheck
```

O Expo Router tem rotas tipadas habilitadas. Antes de alterar APIs de Expo,
Expo Router ou React Native, verifique a documentação correspondente à versão
instalada; as instruções locais em `bueiro-app/AGENTS.md` pedem explicitamente
essa checagem. Para adicionar dependências compatíveis com o SDK, prefira
`npx expo install <pacote>`.

## Orientações para futuras alterações

- Preserve compatibilidade com Android, iOS e web sempre que o recurso e as
  dependências permitirem; o foco de uso é mobile e Expo Go.
- Respeite permissões explícitas de localização, câmera, galeria e notificações.
- Trate erros de rede, API e armazenamento de forma visível; não transforme
  falhas em respostas aparentemente bem-sucedidas.
- Ao alterar a API consumida, alinhe o app com o backend e confirme o contrato
  real antes de presumir nomes de campos ou formatos.
- Não inclua segredos, arquivos `.env.local`, dados pessoais reais ou
  credenciais em código, documentação, logs ou commits.
- Faça mudanças pequenas e relacionadas à tarefa, mantenha tipos explícitos e
  execute lint e verificação TypeScript após alterações de código.
- Não há configuração de testes automatizados declarada nos scripts atuais do
  pacote; não afirme que uma suíte foi executada sem confirmar sua existência.

## Instrução inicial sugerida para outra IA

> Você está trabalhando no app móvel Bueiro Inteligente. Leia `CONTEXTO.md`,
> `bueiro-app/AGENTS.md` e os arquivos relevantes antes de alterar código. O
> app usa Expo SDK 58, React Native, TypeScript e Expo Router; as telas ficam
> em `bueiro-app/src/app`, os serviços em `bueiro-app/src/services`, e o
> backend é um projeto separado. Preserve os fluxos de cache/offline, valide
> contratos da API no backend quando necessário, não leia nem exponha
> `.env.local`, e rode lint e typecheck para mudanças de código.
