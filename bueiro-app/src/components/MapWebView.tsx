import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import WebView, {
  WebViewMessageEvent,
  WebViewProps,
} from 'react-native-webview';

import { Bueiro, Ocorrencia, Previsao } from '../services/api';
import { cores } from '../constants/theme';

const MAPA_HTML = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <style>
    html, body, #mapa { height: 100%; margin: 0; width: 100%; }
    .detalhe { font: 14px sans-serif; min-width: 150px; }
    .detalhe button { background: #146c50; border: 0; border-radius: 6px; color: white; margin-top: 8px; padding: 8px 10px; }
    .risco { background: white; border: 1px solid #d8e3d8; border-radius: 8px; color: #26352d; font: 600 13px sans-serif; left: 10px; padding: 9px 12px; position: absolute; top: 10px; z-index: 1000; }
  </style>
</head>
<body>
  <div id="mapa"></div>
  <div id="risco" class="risco" hidden></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const mapa = L.map('mapa').setView([-23.5505, -46.6333], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(mapa);
    const marcadores = L.layerGroup().addTo(mapa);
    const camadaLocalizacao = L.layerGroup().addTo(mapa);
    const cores = { livre: '#228b5a', atencao: '#d98716', critico: '#c83f3f' };
    const coresRisco = { baixo: '#228b5a', moderado: '#d98716', alto: '#c83f3f' };
    const rotulosRisco = { baixo: 'Baixo', moderado: 'Moderado', alto: 'Alto' };
    let centralizadoNaLocalizacao = false;

    window.setMapData = function(dados) {
      marcadores.clearLayers();
      camadaLocalizacao.clearLayers();
      (dados.bueiros || []).forEach((bueiro) => {
        const marcador = L.circleMarker([bueiro.latitude, bueiro.longitude], {
          radius: 9,
          color: '#ffffff',
          weight: 2,
          fillColor: cores[bueiro.status] || '#66756d',
          fillOpacity: 0.95,
        }).addTo(marcadores);
        const popup = document.createElement('div');
        popup.className = 'detalhe';
        const nome = document.createElement('strong');
        nome.textContent = bueiro.nome;
        const nivel = document.createElement('div');
        nivel.textContent = 'Nível: ' + Math.round(bueiro.nivel) + '%';
        const acao = document.createElement('button');
        acao.textContent = 'Ver detalhes';
        acao.addEventListener('click', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            tipo: 'bueiro',
            id: bueiro.id,
          }));
        });
        popup.append(nome, nivel, acao);
        marcador.bindPopup(popup);
      });

      (dados.ocorrencias || []).forEach((ocorrencia) => {
        const raios = { leve: 7, moderada: 10, grave: 14 };
        const marcador = L.circleMarker(
          [ocorrencia.latitude, ocorrencia.longitude],
          {
            radius: raios[ocorrencia.gravidade] || 8,
            color: '#0d4f99',
            weight: 2,
            fillColor: '#2276d2',
            fillOpacity: 0.8,
          },
        ).addTo(marcadores);
        const popup = document.createElement('div');
        const titulo = document.createElement('strong');
        titulo.textContent = 'Alagamento (' + ocorrencia.gravidade + ')';
        const descricao = document.createElement('div');
        descricao.textContent = ocorrencia.descricao || 'Sem descrição';
        popup.append(titulo, descricao);
        marcador.bindPopup(popup);
      });

      const indicadorRisco = document.getElementById('risco');
      if (dados.localizacao) {
        const coordenadas = [dados.localizacao.latitude, dados.localizacao.longitude];
        const corRisco = coresRisco[dados.risco] || '#66756d';
        const textoRisco = rotulosRisco[dados.risco] || 'indisponível';
        indicadorRisco.hidden = false;
        indicadorRisco.textContent = dados.carregandoRisco
          ? 'Consultando risco...'
          : 'Risco estimado (bueiro próximo): ' + textoRisco;

        L.circle(coordenadas, {
          radius: dados.raioRiscoMetros,
          color: corRisco,
          weight: 2,
          fillColor: corRisco,
          fillOpacity: 0.2,
        })
          .bindPopup('Risco estimado pelo bueiro próximo: ' + textoRisco)
          .addTo(camadaLocalizacao);
        L.circleMarker(coordenadas, {
          radius: 7,
          color: '#ffffff',
          weight: 2,
          fillColor: '#146caa',
          fillOpacity: 1,
        })
          .bindPopup('Sua localização')
          .addTo(camadaLocalizacao);

        if (!centralizadoNaLocalizacao) {
          mapa.setView(coordenadas, 15);
          centralizadoNaLocalizacao = true;
        }
      } else {
        indicadorRisco.hidden = true;
      }
    };
  </script>
</body>
</html>`;

interface MensagemMapa {
  tipo: 'bueiro';
  id: number;
}

interface LocalizacaoMapa {
  latitude: number;
  longitude: number;
}

export function MapWebView({
  bueiros,
  ocorrencias,
  localizacao,
  risco,
  carregandoRisco,
  aoAbrirBueiro,
}: {
  bueiros: Bueiro[];
  ocorrencias: Ocorrencia[];
  localizacao: LocalizacaoMapa | null;
  risco: Previsao['risco'] | null;
  carregandoRisco: boolean;
  aoAbrirBueiro: (id: number) => void;
}) {
  const mapaRef = useRef<WebView<WebViewProps>>(null);
  const [carregado, setCarregado] = useState(false);
  const [erro, setErro] = useState(false);
  const dados = {
    bueiros,
    ocorrencias,
    localizacao,
    risco,
    carregandoRisco,
    raioRiscoMetros: 500,
  };

  useEffect(() => {
    if (!carregado) return;
    const payload = JSON.stringify(dados).replace(/</g, '\\u003c');
    mapaRef.current?.injectJavaScript(
      `window.setMapData(${payload}); true;`,
    );
  }, [carregado, bueiros, ocorrencias, localizacao, risco, carregandoRisco]);

  function receberMensagem(evento: WebViewMessageEvent) {
    try {
      const mensagem = JSON.parse(evento.nativeEvent.data) as MensagemMapa;
      if (mensagem.tipo === 'bueiro' && Number.isInteger(mensagem.id)) {
        aoAbrirBueiro(mensagem.id);
      }
    } catch (falha) {
      console.warn('Mensagem inválida recebida do mapa.', falha);
    }
  }

  if (erro) {
    return (
      <View style={styles.erro}>
        <Text style={styles.textoErro}>
          Não foi possível carregar o mapa. Verifique a conexão com a internet.
        </Text>
      </View>
    );
  }

  return (
    <WebView<WebViewProps>
      ref={mapaRef}
      originWhitelist={['*']}
      source={{ html: MAPA_HTML }}
      javaScriptEnabled
      onLoadEnd={() => setCarregado(true)}
      onError={() => setErro(true)}
      onMessage={receberMensagem}
      style={styles.mapa}
    />
  );
}

const styles = StyleSheet.create({
  mapa: { flex: 1 },
  erro: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  textoErro: { color: cores.textoSecundario, textAlign: 'center' },
});
