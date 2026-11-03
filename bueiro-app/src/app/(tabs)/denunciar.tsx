import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import { Screen } from '../../components/Screen';
import { cores } from '../../constants/theme';
import {
  ApiError,
  Gravidade,
  NovaOcorrencia,
} from '../../services/api';
import { enviarOuEnfileirarDenuncia } from '../../services/offlineQueue';

const opcoesGravidade: { valor: Gravidade; rotulo: string }[] = [
  { valor: 'leve', rotulo: 'Leve' },
  { valor: 'moderada', rotulo: 'Moderada' },
  { valor: 'grave', rotulo: 'Grave' },
];

export default function DenunciarScreen() {
  const [descricao, setDescricao] = useState('');
  const [gravidade, setGravidade] = useState<Gravidade>('moderada');
  const [coordenadas, setCoordenadas] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [foto, setFoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [carregandoLocalizacao, setCarregandoLocalizacao] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function obterLocalizacao() {
    setCarregandoLocalizacao(true);
    setErro(null);
    try {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (permissao.status !== 'granted') {
        setErro(
          'A localização foi negada. Ative a permissão nas configurações ou tente novamente.',
        );
        return;
      }

      const local = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoordenadas({
        latitude: local.coords.latitude,
        longitude: local.coords.longitude,
      });
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? `Não foi possível obter a localização: ${falha.message}`
          : 'Não foi possível obter a localização.',
      );
    } finally {
      setCarregandoLocalizacao(false);
    }
  }

  async function selecionarFoto(origem: 'camera' | 'galeria') {
    setErro(null);
    try {
      let resultado: ImagePicker.ImagePickerResult;
      if (origem === 'camera') {
        const permissao = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissao.granted) {
          setErro('Permissão da câmera negada. Altere-a nas configurações do aparelho.');
          return;
        }
        resultado = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.75,
        });
      } else {
        resultado = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.75,
        });
      }

      if (!resultado.canceled) setFoto(resultado.assets[0]);
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? `Não foi possível selecionar a foto: ${falha.message}`
          : 'Não foi possível selecionar a foto.',
      );
    }
  }

  async function enviarDenuncia() {
    if (!coordenadas) {
      setErro('Informe a localização antes de enviar a denúncia.');
      return;
    }

    setEnviando(true);
    setErro(null);
    setMensagem(null);
    const dados: NovaOcorrencia = {
      descricao: descricao.trim(),
      ...coordenadas,
      gravidade,
    };

    try {
      const resultado = await enviarOuEnfileirarDenuncia(
        dados,
        foto?.uri ?? null,
        foto?.mimeType ?? 'image/jpeg',
      );
      setMensagem(
        resultado === 'enviada'
          ? 'Denúncia enviada com sucesso.'
          : 'Sem conexão. A denúncia foi salva e será reenviada quando a API voltar.',
      );
      setDescricao('');
      setGravidade('moderada');
      setCoordenadas(null);
      setFoto(null);
    } catch (falha) {
      setErro(
        falha instanceof ApiError
          ? falha.message
          : falha instanceof Error
            ? falha.message
            : 'Não foi possível registrar a denúncia.',
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Screen
      titulo="Denunciar alagamento"
      subtitulo="Registre um ponto de alagamento para ajudar a comunidade"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.rotulo}>Gravidade</Text>
          <View style={styles.opcoes}>
            {opcoesGravidade.map((opcao) => (
              <Pressable
                key={opcao.valor}
                accessibilityRole="radio"
                accessibilityState={{ selected: gravidade === opcao.valor }}
                onPress={() => setGravidade(opcao.valor)}
                style={[
                  styles.opcao,
                  gravidade === opcao.valor && styles.opcaoSelecionada,
                ]}
              >
                <Text
                  style={[
                    styles.textoOpcao,
                    gravidade === opcao.valor && styles.textoOpcaoSelecionada,
                  ]}
                >
                  {opcao.rotulo}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.rotulo}>Descrição (opcional)</Text>
          <TextInput
            accessibilityLabel="Descrição do alagamento"
            multiline
            maxLength={2000}
            onChangeText={setDescricao}
            placeholder="Descreva o local e a situação..."
            style={styles.campoDescricao}
            textAlignVertical="top"
            value={descricao}
          />

          <Text style={styles.rotulo}>Localização</Text>
          <Pressable
            disabled={carregandoLocalizacao}
            onPress={() => void obterLocalizacao()}
            style={styles.botaoSecundario}
          >
            <Text style={styles.textoBotao}>
              {carregandoLocalizacao
                ? 'Obtendo localização...'
                : coordenadas
                  ? 'Atualizar localização'
                  : 'Usar minha localização'}
            </Text>
          </Pressable>
          {coordenadas ? (
            <Text style={styles.ajuda}>
              {coordenadas.latitude.toFixed(5)}, {coordenadas.longitude.toFixed(5)}
            </Text>
          ) : (
            <Text style={styles.ajuda}>
              A permissão é solicitada quando você toca no botão.
            </Text>
          )}

          <Text style={styles.rotulo}>Foto (opcional)</Text>
          <View style={styles.opcoesFoto}>
            <Pressable
              onPress={() => void selecionarFoto('camera')}
              style={styles.botaoSecundario}
            >
              <Text style={styles.textoBotao}>Abrir câmera</Text>
            </Pressable>
            <Pressable
              onPress={() => void selecionarFoto('galeria')}
              style={styles.botaoSecundario}
            >
              <Text style={styles.textoBotao}>Escolher da galeria</Text>
            </Pressable>
          </View>
          {foto ? (
            <View style={styles.fotoContainer}>
              <Image source={{ uri: foto.uri }} style={styles.foto} />
              <Pressable onPress={() => setFoto(null)}>
                <Text style={styles.link}>Remover foto</Text>
              </Pressable>
            </View>
          ) : null}

          {erro ? <Text accessibilityRole="alert" style={styles.erro}>{erro}</Text> : null}
          {mensagem ? <Text style={styles.sucesso}>{mensagem}</Text> : null}

          <Pressable
            disabled={enviando}
            onPress={() => void enviarDenuncia()}
            style={[styles.botaoEnviar, enviando && styles.desabilitado]}
          >
            <Text style={styles.textoEnviar}>
              {enviando ? 'Salvando denúncia...' : 'Enviar denúncia'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: { gap: 11, paddingBottom: 30, paddingTop: 2 },
  rotulo: {
    color: cores.texto,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 7,
  },
  opcoes: { flexDirection: 'row', gap: 9 },
  opcao: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    padding: 11,
  },
  opcaoSelecionada: {
    backgroundColor: '#e8f3e7',
    borderColor: cores.primario,
  },
  textoOpcao: { color: cores.textoSecundario, fontSize: 13, fontWeight: '700' },
  textoOpcaoSelecionada: { color: cores.primario },
  campoDescricao: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: 16,
    borderWidth: 1,
    color: cores.texto,
    minHeight: 100,
    padding: 14,
  },
  botaoSecundario: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  textoBotao: { color: cores.primario, fontSize: 13, fontWeight: '700' },
  ajuda: { color: cores.textoSecundario, fontSize: 12, lineHeight: 18 },
  opcoesFoto: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fotoContainer: { alignItems: 'flex-start', gap: 8 },
  foto: { borderRadius: 16, height: 180, width: '100%' },
  link: { color: cores.primario, fontWeight: '700' },
  erro: { color: cores.critico, fontSize: 13, lineHeight: 19 },
  sucesso: { color: cores.livre, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  botaoEnviar: {
    alignItems: 'center',
    backgroundColor: cores.primario,
    borderRadius: 16,
    marginTop: 8,
    minHeight: 54,
    justifyContent: 'center',
    shadowColor: cores.cabecalho,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 9,
    elevation: 3,
  },
  desabilitado: { opacity: 0.6 },
  textoEnviar: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
