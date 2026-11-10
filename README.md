# Bueiro-Inteligente-mobile--app

Aplicativo Expo Go para monitoramento de bueiros e registro de denúncias de
alagamentos, integrado à API do projeto Bueiro Inteligente.

## Executar no Expo Go

1. Configure a API do TCC e aplique a migração
   `bueiro_inteligente_api/migrations/001_app_mobile.sql`.
2. No diretório `bueiro-app`, configure `EXPO_PUBLIC_API_URL` em `.env.local`
   com o endereço completo da API, por exemplo `http://192.168.0.10:8000`.
   Use o IPv4 do computador na rede Wi-Fi do celular, não `localhost`.
3. Instale e inicie o app:

   ```powershell
   cd bueiro-app
   npm install
   npx expo start --clear --lan
   ```

   Se alterar `.env.local` com o Expo já iniciado, encerre o servidor e inicie-o
   novamente com o comando acima para que o novo endereço entre no app.

4. Abra o Expo Go no celular, na mesma rede Wi-Fi, e leia o QR code.

O mapa usa Leaflet e OpenStreetMap sem chave paga e precisa de internet para
carregar os tiles. O app oferece mapa, lista, detalhe, resumo, localização e
fotos opcionais na denúncia, cache/offline, polling e alertas locais. Push
remoto não é suportado pelo Expo Go no Android.

Para contexto técnico, arquitetura, contratos da API e orientações para
desenvolvimento com outras pessoas ou IAs, consulte
[CONTEXTO.md](./CONTEXTO.md).

As instruções de inicialização e o simulador estão no
[README do repositório do TCC](https://github.com/FledWriter3840/Bueiro-Inteligente-IoT-TCC).
