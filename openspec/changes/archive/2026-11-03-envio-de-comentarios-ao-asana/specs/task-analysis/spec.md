## ADDED Requirements

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
