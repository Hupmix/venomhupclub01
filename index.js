const { create, Client } = require('venom-bot');
const fs = require('fs');
const { google } = require('googleapis');

const CRED_PATH = './venomclub-7987ea751618.json';
const TOKEN_PATH = './token.json';
const SPREADSHEET_ID = '1YWIzqRxGV7g09x2A-F744AbfxfMioy129smoNeKtoI8';
const SHEET_NAME = 'Cadastro';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function autorizarGoogle(callback) {
  const credenciais = JSON.parse(fs.readFileSync(CRED_PATH));
  const { client_email, private_key } = credenciais;
  const auth = new google.auth.JWT(client_email, null, private_key, SCOPES);
  auth.authorize((err) => {
    if (err) {
      console.error('Erro ao autorizar Google:', err);
      return;
    }
    console.log('✅ Cliente autorizado com sucesso. Tudo pronto para integrar!');
    callback(auth);
  });
}

function adicionarNaPlanilha(auth, nome, telefone, cidade) {
  const sheets = google.sheets({ version: 'v4', auth });
  const valores = [[nome, telefone, cidade, new Date().toLocaleString()]];

  sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: valores },
  }, (err, res) => {
    if (err) {
      console.error('Erro ao adicionar cliente:', err);
    } else {
      console.log('✅ Cliente adicionado com sucesso!');
    }
  });
}

create({
  session: 'hupmix',
  headless: true,
  devtools: false,
  useChrome: false,
  debug: false,
  logQR: true,
  browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
  puppeteerOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
}).then((client) => {
  autorizarGoogle((auth) => {
    client.onMessage(async (message) => {
      if (message.body && message.from.includes('@c.us')) {
        const telefone = message.from.replace('@c.us', '');
        const partes = message.body.split('-');
        const nome = partes[0]?.trim() || 'Sem Nome';
        const cidade = partes[1]?.trim() || 'Sem Cidade';
        adicionarNaPlanilha(auth, nome, telefone, cidade);
        await client.sendText(message.from, 'Cadastro realizado com sucesso! Obrigado por se conectar com a HupMix!');
      }
    });
  });
}).catch((error) => {
  console.error('Erro ao iniciar o bot:', error);
});