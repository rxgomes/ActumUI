# task-analysis Specification

## Purpose

Define como o front exibe e conduz a análise com IA da demanda de uma tarefa no detalhe: geração com um clique, objetivo, checklist por área com os trechos vagos, testes e dúvidas marcáveis, reanálise e versões anteriores.

## Requirements

### Requirement: Seção Análise com IA no detalhe
A página de detalhe da tarefa SHALL exibir a seção "Análise com IA" no topo da coluna lateral, ao lado dos dados e da descrição (visível ao abrir a tarefa, sem rolar), carregada por `GET /tarefas/{identifier}/analises` e `GET /claude/situacao`, sem atrasar a exibição do resto do detalhe.

#### Scenario: Carregando
- **WHEN** o detalhe da tarefa já foi exibido e as análises ainda estão sendo lidas
- **THEN** a seção MUST mostrar um indicador de carregamento enquanto o resto da página continua utilizável

#### Scenario: Falha ao carregar
- **WHEN** a leitura das análises falha
- **THEN** a seção MUST mostrar a mensagem de erro da API e um botão "Tentar novamente", sem afetar o resto do detalhe

### Requirement: Análise com um clique
Sem análise, a seção SHALL oferecer o botão "Analisar com IA", que abre o diálogo "Fontes da análise" e, confirmado, chama `POST /tarefas/{identifier}/analises` com as fontes escolhidas e exibe a análise devolvida. A seção MUST informar que a análise é paga e envia o conteúdo da tarefa, inclusive os anexos escolhidos, à Anthropic.

#### Scenario: Primeira análise
- **WHEN** a tarefa nunca foi analisada e o usuário clica em "Analisar com IA" e confirma as fontes no diálogo
- **THEN** a seção MUST mostrar o progresso (a análise pode levar até um minuto, mais com anexos grandes) e, ao terminar, exibir a análise e notificar "Análise concluída."

#### Scenario: Chave não configurada
- **WHEN** `GET /claude/situacao` informa `configurado=false`
- **THEN** a seção MUST explicar que a chave da Claude API não está configurada, mostrar o comando `dotnet user-secrets set "Claude:ApiKey" "<sua-chave>" --project src/Actum.Api` e não oferecer o botão de análise

#### Scenario: Tarefa arquivada
- **WHEN** a tarefa está arquivada
- **THEN** o botão de análise MUST ficar desabilitado com a explicação de que tarefas arquivadas não podem ser analisadas; análises existentes continuam visíveis

#### Scenario: Falha da análise
- **WHEN** a API responde erro ao analisar (`400` sem créditos, chave recusada ou recusa do modelo; `409` análise em andamento; `502` indisponível, anexo não baixado do Asana ou resposta incompleta; falha de rede)
- **THEN** a seção MUST exibir a mensagem da API em destaque, manter a análise anterior (se houver) e permitir tentar de novo

### Requirement: Exibição da análise
A seção SHALL exibir a versão atual com o objetivo, o checklist agrupado por área na ordem da API, os testes, as dúvidas, as regras e observações, cada item com origem e trecho quando houver, o progresso do checklist e o rodapé com versão, data e hora, modelo, tokens e fontes.

#### Scenario: Checklist por área com trecho vago
- **WHEN** a análise tem os grupos "Front", "Back: cálculo" e "Back: integração TecnoSpeed" e um item do grupo "Back: cálculo" tem `vago` preenchido
- **THEN** os itens MUST aparecer sob o título de cada grupo, nessa ordem, e o item vago MUST mostrar um aviso ⚠️ com a explicação

#### Scenario: Progresso do checklist
- **WHEN** 3 dos 11 itens do checklist estão marcados
- **THEN** a seção MUST mostrar "3 de 11 itens feitos"

#### Scenario: Sem testes ou sem dúvidas
- **WHEN** a análise não tem testes ou não tem dúvidas
- **THEN** o bloco correspondente MUST ser omitido

#### Scenario: Regras com origem
- **WHEN** a análise tem a regra "O desconto não pode passar de 10%" com origem "comentário de Maria em 04/11/2026 14:30"
- **THEN** o bloco "Regras e observações" MUST mostrar a regra e, abaixo dela, a origem

#### Scenario: Sem regras
- **WHEN** a análise não tem regras, inclusive versões gravadas antes da seção existir
- **THEN** o bloco "Regras e observações" MUST ser omitido

### Requirement: Marcação dos itens
Cada item do checklist, teste, dúvida e regra da versão atual SHALL ter uma caixa de marcação que chama `PATCH /tarefas/{identifier}/analises/itens/{itemIdentifier}` e mostra o item como feito (checklist), realizado (teste), resolvido (dúvida) ou atendido (regra).

#### Scenario: Marcar item
- **WHEN** o usuário marca um item do checklist
- **THEN** a caixa MUST ficar indisponível até a resposta da API, e o item MUST aparecer marcado e riscado, com o progresso atualizado

#### Scenario: Marcar regra
- **WHEN** o usuário marca uma regra
- **THEN** a regra MUST aparecer marcada e riscada, com a dica "Regra atendida em" e a data da marcação

#### Scenario: Falha ao marcar
- **WHEN** a API responde erro à marcação
- **THEN** o item MUST voltar ao estado anterior e o erro MUST ser notificado

### Requirement: Reanálise e versões
A seção SHALL oferecer "Reanalisar", que abre o diálogo "Fontes da análise" com as fontes da versão atual e o aviso de que a chamada é paga e gera nova versão; confirmado, exibe a nova versão como atual. As versões anteriores SHALL poder ser consultadas, somente leitura.

#### Scenario: Reanalisar
- **WHEN** a tarefa tem a versão 1 e o usuário clica em "Reanalisar" e confirma o diálogo
- **THEN** a seção MUST exibir a versão 2 como atual, com os itens que a API devolveu já marcados

#### Scenario: Cancelar a reanálise
- **WHEN** o usuário fecha o diálogo sem confirmar
- **THEN** nenhuma chamada MUST ser feita

#### Scenario: Consultar versão anterior
- **WHEN** a tarefa tem duas versões e o usuário escolhe a versão 1
- **THEN** a seção MUST exibir a versão 1 com as caixas de marcação desabilitadas e a indicação de que é uma versão anterior, com a opção de voltar à atual

### Requirement: Copiar dúvidas
A seção SHALL oferecer "Copiar dúvidas", que copia as dúvidas da versão exibida, numeradas, para a área de transferência.

#### Scenario: Copiar
- **WHEN** a análise tem duas dúvidas e o usuário clica em "Copiar dúvidas"
- **THEN** a área de transferência MUST conter as duas perguntas numeradas, uma por linha, e o usuário MUST ser notificado "Dúvidas copiadas."

### Requirement: Enviar dúvidas ao Asana
A seção "Análise com IA" SHALL oferecer "Enviar dúvidas ao Asana", que preenche a caixa de comentário da tarefa com as dúvidas ainda não resolvidas da versão exibida, numeradas, e leva o foco até a caixa. Nada MUST ser enviado sem o clique em "Enviar ao Asana".

#### Scenario: Dúvidas não resolvidas
- **WHEN** a análise tem três dúvidas, uma delas marcada como resolvida, e o usuário clica em "Enviar dúvidas ao Asana"
- **THEN** a caixa de comentário MUST receber "Dúvidas sobre a tarefa:" seguido das duas dúvidas não resolvidas, numeradas 1 e 2, a página MUST rolar até a caixa e nenhuma chamada de envio MUST ser feita

#### Scenario: Caixa já com texto
- **WHEN** a caixa já tem um texto escrito pelo usuário
- **THEN** as dúvidas MUST ser acrescentadas depois de uma linha em branco, sem apagar o texto

#### Scenario: Todas resolvidas
- **WHEN** todas as dúvidas estão marcadas como resolvidas
- **THEN** o botão MUST ficar desabilitado com a dica "Todas as dúvidas estão resolvidas."

### Requirement: Comentários atualizados pela análise
Depois de uma análise ou reanálise concluída, a página de detalhe SHALL recarregar a tarefa, para os comentários que a API trouxe do Asana aparecerem na lista de comentários.

#### Scenario: Comentário novo trazido pela análise
- **WHEN** a análise termina com sucesso e a API gravou um comentário que estava só no Asana
- **THEN** o comentário MUST aparecer na lista de comentários do detalhe sem o usuário recarregar a página

#### Scenario: Análise com falha
- **WHEN** a análise falha
- **THEN** o detalhe MUST NOT ser recarregado e a mensagem da API MUST ser exibida como nas outras falhas da análise

### Requirement: Copiar para o OpenSpec
A seção "Análise com IA" SHALL oferecer "Copiar para o OpenSpec", que copia a versão exibida como texto Markdown para o `/opsx:explore`: primeira linha `/opsx:explore <título da tarefa>`, depois os dados da tarefa (empresa, projetos, link do Asana, versão, data e fontes), o objetivo, o checklist por área, os testes, as dúvidas e as regras como listas de tarefas, e por fim as seções "Locais" e "Notas".

#### Scenario: Copiar a análise
- **WHEN** a análise exibida tem objetivo, checklist com os grupos "Front" e "Back", testes, dúvidas e regras, e o usuário clica em "Copiar para o OpenSpec"
- **THEN** a área de transferência MUST conter o texto iniciado por `/opsx:explore` e o título da tarefa, com uma seção para cada bloco na ordem da tela e um subtítulo por grupo do checklist, e o usuário MUST ser notificado "Análise copiada para o OpenSpec."

#### Scenario: Itens marcados, vagos e com origem
- **WHEN** um item do checklist está marcado, outro tem `vago` preenchido, um item do checklist ou uma dúvida tem trecho e uma regra tem só origem
- **THEN** o item marcado MUST aparecer como `- [x]`, os demais como `- [ ]`, o trecho vago MUST aparecer abaixo do item como "Vago:", o trecho abaixo do item como `Trecho (<origem>): "<trecho>"` e a origem sem trecho como "Origem:"

#### Scenario: Fontes nos dados da tarefa
- **WHEN** a versão foi feita com a descrição e o anexo `layout.pdf`, ou no modo "Prompt"
- **THEN** os dados da tarefa MUST trazer a linha `- **Fontes:** Descrição, layout.pdf`, ou `- **Fontes:** Prompt` seguida do texto do prompt como citação

#### Scenario: Locais e notas no fim
- **WHEN** o usuário copia qualquer versão da análise, com ou sem testes, dúvidas ou regras
- **THEN** imediatamente antes de "## Notas" o texto MUST ter a seção "## Locais" com "- Front: D:\Aureum\erp-frontend\erp-aureum\src\pages\", "- Back:  Z:\Aureum\erp-backend\Source\ErpAureum\ErpAureum\" e "- Varrer os endpoints que alimentam essa lista", nessa ordem
- **AND** o texto MUST terminar com a seção "## Notas" e as orientações "1. Decisões que eu preciso tomar, com opções e recomendação." e "2. Não altere código, apenas analise.", nessa ordem

#### Scenario: Blocos vazios
- **WHEN** a análise não tem testes, dúvidas ou regras
- **THEN** a seção correspondente MUST ser omitida do texto

#### Scenario: Versão anterior
- **WHEN** o usuário está vendo uma versão anterior
- **THEN** o texto copiado MUST ser o dessa versão, com o número dela

#### Scenario: Falha ao copiar
- **WHEN** o navegador não permite copiar
- **THEN** o usuário MUST ser notificado "Não foi possível copiar a análise."

### Requirement: Escolha das fontes da análise
Antes de cada análise ou reanálise, a seção SHALL abrir o diálogo "Fontes da análise" com dois modos: "Da tarefa", em que o usuário marca uma ou mais entre Descrição, Comentários (com o histórico de retrabalhos) e Anexos; e "Prompt", em que escreve um texto próprio no lugar da descrição e dos anexos, podendo ainda marcar Comentários. A análise só MUST ser enviada pelo botão "Analisar" do diálogo, com as fontes escolhidas.

#### Scenario: Primeira análise com o padrão
- **WHEN** a tarefa nunca foi analisada e o usuário clica em "Analisar com IA"
- **THEN** o diálogo MUST abrir no modo "Da tarefa" com Descrição e Comentários marcados e nenhum anexo escolhido

#### Scenario: Só anexos
- **WHEN** o usuário desmarca Descrição e Comentários, marca Anexos, escolhe `especificacao.pdf` e clica em "Analisar"
- **THEN** a análise MUST ser pedida com descrição e comentários desligados e só o anexo `especificacao.pdf`

#### Scenario: Descrição e anexos
- **WHEN** o usuário mantém Descrição marcada, marca Anexos e escolhe `layout.png` e `regras.docx`
- **THEN** a análise MUST ser pedida com a descrição e os dois anexos

#### Scenario: Nenhuma fonte
- **WHEN** no modo "Da tarefa" nenhuma fonte está marcada, ou Anexos está marcado sem arquivo escolhido, ou no modo "Prompt" o texto está vazio
- **THEN** o botão "Analisar" MUST ficar desabilitado com a dica do que falta escolher

#### Scenario: Cancelar o diálogo
- **WHEN** o usuário fecha o diálogo sem clicar em "Analisar"
- **THEN** nenhuma chamada de análise MUST ser feita

#### Scenario: Erro de validação das fontes
- **WHEN** a API responde `400` com `errors` para `Anexos` ou `Prompt` (por exemplo, anexo removido do Asana ou grande demais)
- **THEN** o diálogo MUST continuar aberto, com a mensagem de cada campo junto da lista de anexos ou do prompt, e as escolhas preservadas

### Requirement: Anexos como fonte
O diálogo SHALL listar os anexos da tarefa lidos de `GET /tarefas/{identifier}/anexos`, com nome, data e tamanho, para escolha de um ou mais. Os anexos que a API informar como não legíveis pela análise MUST aparecer desabilitados com o motivo devolvido pela API.

#### Scenario: Anexo não legível
- **WHEN** a tarefa tem `video.mp4` e um arquivo do Google Drive, que a API informa como não legíveis
- **THEN** os dois MUST aparecer desabilitados, cada um com o motivo da API, e não podem ser escolhidos

#### Scenario: Tarefa sem anexos
- **WHEN** a tarefa não tem anexos
- **THEN** a opção Anexos MUST ficar desabilitada com a explicação "A tarefa não tem anexos no Asana."

#### Scenario: Carregando e falha dos anexos
- **WHEN** os anexos ainda estão sendo lidos ou a leitura falha
- **THEN** a lista MUST mostrar o carregamento ou a mensagem da API com "Tentar novamente", sem impedir a análise com as outras fontes

### Requirement: Prompt com referência a anexos
No modo "Prompt", digitar `@` no texto SHALL abrir a lista dos anexos legíveis; o escolhido MUST entrar no texto como `@<nome do arquivo>`. Os anexos referenciados no texto MUST ser enviados com o prompt e listados abaixo da caixa como "Arquivos referenciados".

#### Scenario: Referenciar um modelo
- **WHEN** o usuário escreve "Siga o padrão de " e, ao digitar `@`, escolhe `modelo-relatorio.pdf`
- **THEN** o texto MUST ficar "Siga o padrão de @modelo-relatorio.pdf" e `modelo-relatorio.pdf` MUST aparecer em "Arquivos referenciados"

#### Scenario: Referência apagada
- **WHEN** o usuário apaga `@modelo-relatorio.pdf` do texto
- **THEN** o arquivo MUST sair de "Arquivos referenciados" e não ser enviado

#### Scenario: Prompt sem arquivos
- **WHEN** o prompt não referencia nenhum anexo
- **THEN** a análise MUST ser pedida só com o texto do prompt (e os comentários, se marcados)

### Requirement: Fontes gravadas na versão
Cada versão SHALL exibir no rodapé as fontes que a API gravou para ela (Descrição, Comentários, os nomes dos anexos ou "Prompt"). "Reanalisar" MUST abrir o diálogo já com as fontes da versão atual, incluindo o texto do prompt.

#### Scenario: Rodapé com as fontes
- **WHEN** a versão 2 foi feita com a descrição e o anexo `layout.pdf`
- **THEN** o rodapé MUST mostrar "Fontes: Descrição, layout.pdf"

#### Scenario: Versão feita por prompt
- **WHEN** a versão exibida foi feita no modo "Prompt"
- **THEN** o rodapé MUST mostrar "Fontes: Prompt" e o texto do prompt MUST poder ser visto, somente leitura

#### Scenario: Versão antiga sem fontes
- **WHEN** a versão foi gravada antes das fontes existirem
- **THEN** o rodapé MUST mostrar "Fontes: Descrição e comentários" e "Reanalisar" MUST abrir com o padrão

#### Scenario: Anexo da versão removido
- **WHEN** a reanálise abre com um anexo da versão atual que não está mais na tarefa
- **THEN** o anexo MUST ficar fora da escolha e o diálogo MUST avisar que ele não está mais no Asana

### Requirement: Origem e trecho dos itens
Os itens do checklist, as dúvidas e as regras SHALL mostrar, quando a API devolver, a origem (`título`, `descrição`, `comentário de <autor> em <data>`, `anexo <nome>` ou `prompt`) e o trecho literal que os gerou, abaixo do texto do item. Sem trecho, MUST mostrar só a origem; sem os dois, nada.

#### Scenario: Item do checklist com trecho de anexo
- **WHEN** um item do checklist vem com origem `anexo especificacao.pdf` e trecho "O relatório deve ser agrupado por filial"
- **THEN** o item MUST mostrar o trecho entre aspas, em itálico, seguido de "— anexo especificacao.pdf"

#### Scenario: Item vago com trecho
- **WHEN** um item do checklist tem `vago` e trecho preenchidos
- **THEN** o item MUST mostrar o aviso ⚠️ de vago e, abaixo dele, o trecho com a origem

#### Scenario: Itens de análises antigas
- **WHEN** a versão foi feita antes de o checklist ter origem e trecho
- **THEN** os itens do checklist MUST aparecer como antes, sem linha de origem
