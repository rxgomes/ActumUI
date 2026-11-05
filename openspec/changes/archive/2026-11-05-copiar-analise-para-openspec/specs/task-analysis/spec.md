# Spec Delta

## ADDED Requirements

### Requirement: Copiar para o OpenSpec
A seção "Análise com IA" SHALL oferecer "Copiar para o OpenSpec", que copia a versão exibida como texto Markdown para o `/opsx:explore`: primeira linha `/opsx:explore <título da tarefa>`, depois os dados da tarefa (empresa, projetos, link do Asana, versão e data), o objetivo, o checklist por área, os testes, as dúvidas e as regras como listas de tarefas, e por fim a seção "Notas".

#### Scenario: Copiar a análise
- **WHEN** a análise exibida tem objetivo, checklist com os grupos "Front" e "Back", testes, dúvidas e regras, e o usuário clica em "Copiar para o OpenSpec"
- **THEN** a área de transferência MUST conter o texto iniciado por `/opsx:explore` e o título da tarefa, com uma seção para cada bloco na ordem da tela e um subtítulo por grupo do checklist, e o usuário MUST ser notificado "Análise copiada para o OpenSpec."

#### Scenario: Itens marcados, vagos e com origem
- **WHEN** um item do checklist está marcado, outro tem `vago` preenchido e uma regra tem origem
- **THEN** o item marcado MUST aparecer como `- [x]`, os demais como `- [ ]`, o trecho vago MUST aparecer abaixo do item como "Vago:" e a origem abaixo da regra como "Origem:"

#### Scenario: Notas no fim
- **WHEN** o usuário copia qualquer versão da análise, com ou sem testes, dúvidas ou regras
- **THEN** o texto MUST terminar com a seção "## Notas" e as orientações "1. Decisões que eu preciso tomar, com opções e recomendação." e "2. Não altere código, apenas analise.", nessa ordem

#### Scenario: Blocos vazios
- **WHEN** a análise não tem testes, dúvidas ou regras
- **THEN** a seção correspondente MUST ser omitida do texto

#### Scenario: Versão anterior
- **WHEN** o usuário está vendo uma versão anterior
- **THEN** o texto copiado MUST ser o dessa versão, com o número dela

#### Scenario: Falha ao copiar
- **WHEN** o navegador não permite copiar
- **THEN** o usuário MUST ser notificado "Não foi possível copiar a análise."
