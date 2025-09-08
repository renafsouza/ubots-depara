# Como Utilizar o Comparador de Utterances JSON

Este documento explica como utilizar a aplicação para comparar, resolver conflitos e mesclar dois arquivos JSON de utterances.

## Passo a Passo

### 1. Carregar os Arquivos JSON

1.  **Selecione o Primeiro Arquivo:** Clique na caixa com o título **"Arquivo JSON 1"** para abrir o seletor de arquivos do seu sistema. Escolha o primeiro arquivo `.json` que deseja comparar.
2.  **Selecione o Segundo Arquivo:** Faça o mesmo na caixa **"Arquivo JSON 2"** para o segundo arquivo.

Após selecionar ambos os arquivos, a aplicação irá lê-los, processá-los e exibir os resultados da comparação automaticamente. Se houver algum erro de formatação nos arquivos, uma mensagem de erro será exibida.

*Nota: Os arquivos JSON devem conter uma chave `"utterances"` que seja um array de objetos. Cada objeto dentro do array deve possuir uma chave `"condition"` única.*

### 2. Analisar os Resultados da Comparação

Os resultados são divididos em seções colapsáveis, cada uma mostrando a quantidade de itens que contém:

-   **Conflitos para Resolver:** Lista as utterances que existem em ambos os arquivos (com a mesma `condition`), mas cujo conteúdo é diferente. **Esta é a única seção que exige ação obrigatória.**
-   **Apenas em [Nome do Arquivo 1]:** Mostra as utterances que existem apenas no primeiro arquivo.
-   **Apenas em [Nome do Arquivo 2]:** Mostra as utterances que existem apenas no segundo arquivo.
-   **Idênticas em Ambos os Arquivos:** Lista as utterances que são exatamente iguais nos dois arquivos.

### 3. Resolver os Conflitos

Para cada item na seção **"Conflitos para Resolver"**, você deve decidir qual versão manter no arquivo final.

1.  **Analisar as Diferenças:** Clique no botão **"Mostrar Diferenças"** para ver uma comparação linha a linha do conteúdo das duas versões. Linhas em vermelho foram removidas (versão do Arquivo 1) e linhas em verde foram adicionadas (versão do Arquivo 2).
2.  **Escolher uma Versão:** Clique no botão com o nome do arquivo correspondente (`[Nome do Arquivo 1]` ou `[Nome do Arquivo 2]`) para selecionar a versão que deseja manter.
3.  **Resolver Todos de Uma Vez (Opcional):** Se desejar, você pode usar os botões **"Manter Todos de [Nome do Arquivo]"** no cabeçalho da seção para resolver todos os conflitos de uma só vez, escolhendo a versão de um dos arquivos.

O botão de download final só será habilitado quando **todos os conflitos forem resolvidos**.

### 4. Gerenciar a Inclusão de Utterances

Para as seções "Apenas em..." e "Idênticas", você pode escolher quais utterances serão incluídas no arquivo final.

-   **Inclusão Individual:** Use o interruptor (toggle) ao lado de cada utterance para incluí-la (ligado/verde) ou excluí-la (desligado/cinza). Por padrão, todas vêm incluídas.
-   **Inclusão em Massa:** Utilize o botão **"Selecionar Todos"** ou **"Deselecionar Todos"** no cabeçalho de cada seção para incluir ou excluir todos os itens daquela seção de uma só vez.

### 5. Baixar o Arquivo Final

1.  **Habilitação do Botão:** Assim que todos os conflitos forem resolvidos, o botão **"Download JSON Final"** na parte inferior da página se tornará clicável.
2.  **Gerar e Baixar:** Clique neste botão para gerar o novo arquivo JSON mesclado. O arquivo, chamado `merged-utterances.json`, será baixado automaticamente para o seu computador.

O arquivo final conterá todas as utterances idênticas e únicas que foram marcadas para inclusão, e as versões escolhidas para as utterances que estavam em conflito.
