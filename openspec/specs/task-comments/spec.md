# task-comments Specification

## Purpose

Define a caixa de comentário do detalhe da tarefa: texto, anexos, prints colados e menções, enviados ao Asana pela API, com os estados de envio e de erro.

## Requirements

### Requirement: Caixa de comentário no detalhe
O card Comentários do detalhe da tarefa SHALL ter, no topo, a caixa "Novo comentário" com o campo de texto, a área de anexos, a escolha de menções e o botão "Enviar ao Asana". O botão MUST ficar desabilitado sem texto nem arquivo e durante o envio.

#### Scenario: Tarefa em andamento
- **WHEN** o usuário abre uma tarefa não arquivada
- **THEN** a caixa MUST estar disponível, com o botão "Enviar ao Asana" desabilitado até haver texto ou arquivo

#### Scenario: Tarefa arquivada
- **WHEN** a tarefa está arquivada
- **THEN** a caixa MUST ficar desabilitada com a explicação de que tarefas arquivadas não recebem comentários

### Requirement: Anexos e prints
A caixa SHALL aceitar arquivos pelo botão "Anexar", por arrastar e soltar no card e por colar com Ctrl+V no campo de texto. Imagem colada MUST virar um arquivo `print-AAAAMMDD-HHMMSS.png` (hora local). Cada arquivo MUST aparecer com nome, tamanho e, se for imagem, miniatura, e MUST poder ser removido antes do envio.

#### Scenario: Colar um print
- **WHEN** o usuário cola uma imagem com Ctrl+V às 18:15:00 de 03/11/2026
- **THEN** a caixa MUST mostrar o arquivo `print-20261103-181500.png` com miniatura, e o texto colado (se houver) MUST continuar indo para o campo

#### Scenario: Limites dos arquivos
- **WHEN** o usuário adiciona um arquivo com mais de 25 MB, um arquivo vazio, o 11º arquivo ou arquivos que somam mais de 50 MB
- **THEN** o arquivo MUST ser recusado com a mesma mensagem da API (por exemplo "O arquivo video.mp4 tem mais de 25 MB, o limite por arquivo."), sem chamar a API

### Requirement: Menções
A caixa SHALL carregar os participantes por `GET /tarefas/{identifier}/participantes` e permitir escolher quem mencionar, com o participante sugerido já escolhido.

#### Scenario: Pessoa sugerida
- **WHEN** a API devolve Maria Angelica com `sugerido=true`
- **THEN** Maria Angelica MUST aparecer já escolhida para menção, e o usuário MUST poder removê-la ou escolher outros participantes

#### Scenario: Participantes indisponíveis
- **WHEN** a leitura dos participantes falha
- **THEN** a caixa MUST mostrar a mensagem da API junto à escolha de menções, com "Tentar novamente", e o envio sem menção MUST continuar possível

### Requirement: Envio ao Asana
O botão "Enviar ao Asana" (ou Ctrl+Enter no texto) SHALL enviar texto, menções e arquivos por `POST /tarefas/{identifier}/comentarios` (`multipart/form-data`). Em sucesso, a caixa MUST ser limpa (menção volta à sugerida), o usuário MUST ser notificado "Comentário enviado ao Asana." e o detalhe MUST ser recarregado para mostrar o comentário.

#### Scenario: Comentário com print e menção
- **WHEN** o usuário escreve "Segue o erro", mantém Maria Angelica mencionada, cola um print e envia
- **THEN** a API MUST receber o texto, a menção e o arquivo, e o comentário MUST aparecer na lista do detalhe

#### Scenario: Erro no envio
- **WHEN** a API responde erro (`400`, `404`, `502` ou rede)
- **THEN** a mensagem da API MUST aparecer na caixa, e o texto, as menções e os arquivos MUST continuar nela para nova tentativa

#### Scenario: Envio parcial
- **WHEN** a API responde erro com `anexosEnviados` contendo `print-20261103-181500.png`
- **THEN** a mensagem MUST aparecer na caixa, esse arquivo MUST sair da caixa e o texto e os demais arquivos MUST continuar nela
