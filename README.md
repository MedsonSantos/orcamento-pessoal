# 💰 Orçamento Pessoal - GitHub Pages

Um aplicativo completo de controle financeiro pessoal que funciona no GitHub Pages e sincroniza dados com Google Sheets.

## 🚀 Funcionalidades

- ✅ **Dashboard Financeiro** - Visualize receitas, despesas e saldo
- 📊 **Gráficos Interativos** - Pizza e barras para análise visual
- 📋 **Gestão de Contas** - Adicione, edite e exclua contas
- ⏰ **Alertas de Vencimento** - Notificações para contas próximas do vencimento
- ☑️ **Checkbox para Pagamento** - Marque contas como pagas facilmente
- ☁️ **Sincronização Google Sheets** - Backup automático na nuvem
- 📱 **Design Responsivo** - Funciona em desktop e mobile

## 🛠️ Como Configurar no GitHub Pages

### 1. Fork/Clone do Repositório
\`\`\`bash
git clone https://github.com/seu-usuario/orcamento-pessoal.git
cd orcamento-pessoal
\`\`\`

### 2. Ativar GitHub Pages
1. Vá em **Settings** do repositório
2. Navegue até **Pages**
3. Em **Source**, selecione **Deploy from a branch**
4. Escolha **main** branch e **/ (root)**
5. Clique em **Save**

### 3. Configurar Google Sheets (Opcional)

#### Passo 1: Criar Planilha
1. Acesse [Google Sheets](https://sheets.google.com)
2. Crie uma nova planilha
3. Copie o ID da planilha da URL (parte entre `/d/` e `/edit`)

#### Passo 2: Configurar Google Apps Script
1. Na planilha, vá em **Extensões** → **Apps Script**
2. Cole o código abaixo:

\`\`\`javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'test') {
      return ContentService
        .createTextOutput(JSON.stringify({success: true, message: 'Conexão OK'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'sync') {
      const spreadsheet = SpreadsheetApp.openById(data.sheetId);
      
      // Aba Categorias
      let categoriasSheet = spreadsheet.getSheetByName('Categorias');
      if (!categoriasSheet) {
        categoriasSheet = spreadsheet.insertSheet('Categorias');
        categoriasSheet.getRange(1, 1, 1, 3).setValues([['ID', 'Nome', 'Tipo']]);
      }
      
      // Limpar dados existentes (exceto cabeçalho)
      if (categoriasSheet.getLastRow() > 1) {
        categoriasSheet.getRange(2, 1, categoriasSheet.getLastRow() - 1, 3).clear();
      }
      
      // Inserir categorias
      if (data.categorias && data.categorias.length > 0) {
        const categoriasData = data.categorias.map(cat => [cat.id, cat.nome, cat.tipo]);
        categoriasSheet.getRange(2, 1, categoriasData.length, 3).setValues(categoriasData);
      }
      
      // Aba Itens
      let itensSheet = spreadsheet.getSheetByName('Itens');
      if (!itensSheet) {
        itensSheet = spreadsheet.insertSheet('Itens');
        itensSheet.getRange(1, 1, 1, 7).setValues([['ID', 'Categoria', 'Valor', 'Tipo', 'Status', 'Data Vencimento', 'Descrição']]);
      }
      
      // Limpar dados existentes (exceto cabeçalho)
      if (itensSheet.getLastRow() > 1) {
        itensSheet.getRange(2, 1, itensSheet.getLastRow() - 1, 7).clear();
      }
      
      // Inserir itens
      if (data.itens && data.itens.length > 0) {
        const itensData = data.itens.map(item => [
          item.id,
          item.categoria,
          item.valor,
          item.tipo,
          item.status,
          item.dataVencimento || '',
          item.descricao || ''
        ]);
        itensSheet.getRange(2, 1, itensData.length, 7).setValues(itensData);
      }
      
      // Aba Log
      let logSheet = spreadsheet.getSheetByName('Log');
      if (!logSheet) {
        logSheet = spreadsheet.insertSheet('Log');
        logSheet.getRange(1, 1, 1, 2).setValues([['Timestamp', 'Ação']]);
      }
      
      // Adicionar log
      const lastRow = logSheet.getLastRow() + 1;
      logSheet.getRange(lastRow, 1, 1, 2).setValues([[new Date(), 'Sincronização realizada']]);
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, message: 'Dados sincronizados'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: 'Ação não reconhecida'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({success: true, message: 'API funcionando'}))
    .setMimeType(ContentService.MimeType.JSON);
}
\`\`\`

#### Passo 3: Publicar o Script
1. Clique em **Implantar** → **Nova implantação**
2. Escolha **Aplicativo da web**
3. Em **Executar como**, selecione **Eu**
4. Em **Quem tem acesso**, selecione **Qualquer pessoa**
5. Clique em **Implantar**
6. Copie a **URL do aplicativo da web**

#### Passo 4: Configurar no App
1. Abra o aplicativo no GitHub Pages
2. Clique em **⚙️ Configurações**
3. Cole a **URL do Google Apps Script**
4. Cole o **ID da Planilha**
5. Clique em **Testar Conexão**
6. Se tudo estiver OK, clique em **Salvar**

## 📱 Como Usar

### Dashboard
- Visualize o resumo financeiro
- Compare valores previstos vs realizados
- Gerencie categorias

### Contas
- ➕ **Adicionar**: Clique em "Nova Conta"
- ✏️ **Editar**: Clique no ícone de edição
- 🗑️ **Excluir**: Clique no ícone de lixeira
- ☑️ **Marcar como Pago**: Clique no checkbox

### Sincronização
- Clique em **☁️ Sincronizar com Google Sheets**
- Os dados são salvos automaticamente após cada alteração
- Verifique a planilha para ver os dados sincronizados

## 🔧 Tecnologias Utilizadas

- **HTML5** - Estrutura
- **CSS3** - Estilização
- **JavaScript** - Lógica e interatividade
- **Tailwind CSS** - Framework CSS
- **Chart.js** - Gráficos
- **Google Apps Script** - Backend para sincronização
- **Google Sheets** - Armazenamento de dados

## 📊 Estrutura da Planilha

A planilha criada terá 3 abas:

1. **Categorias**: ID, Nome, Tipo
2. **Itens**: ID, Categoria, Valor, Tipo, Status, Data Vencimento, Descrição
3. **Log**: Timestamp, Ação

## 🚀 Deploy Automático

O aplicativo é automaticamente atualizado no GitHub Pages sempre que você fizer push para a branch main.

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique se a configuração do Google Apps Script está correta
2. Teste a conexão nas configurações
3. Verifique o console do navegador para erros
4. Abra uma issue no GitHub

---

**Desenvolvido com ❤️ para ajudar no controle financeiro pessoal**
