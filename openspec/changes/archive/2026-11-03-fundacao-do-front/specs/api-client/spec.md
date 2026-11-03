# Spec Delta

## Purpose

Define como o front se comunica com a Actum API: endereço configurável, contrato derivado do OpenAPI, apresentação uniforme dos erros em pt-BR e tratamento das datas sem deslocamento de fuso.

## ADDED Requirements

### Requirement: Endereço da API configurável
O front SHALL enviar todas as requisições para o endereço base definido na configuração `VITE_API_URL`, sem endereço fixo no código.

#### Scenario: Endereço de desenvolvimento
- **WHEN** o front roda em desenvolvimento com `VITE_API_URL=http://localhost:5180`
- **THEN** uma consulta da conexão com o Asana MUST ser enviada para `http://localhost:5180/asana/conexao`

### Requirement: Contrato derivado do OpenAPI
Os formatos de requisição e resposta usados pelo front MUST corresponder ao documento OpenAPI publicado pela API. Quando o contrato mudar e o front não for ajustado, a verificação de tipos do build MUST falhar.

#### Scenario: Campo renomeado na API
- **WHEN** um campo usado pelo front é renomeado no documento OpenAPI e os tipos são regenerados
- **THEN** `npm run build` MUST falhar apontando o uso do campo antigo

#### Scenario: Build sem a API
- **WHEN** `npm run build` é executado com a API desligada
- **THEN** o build MUST concluir usando o contrato versionado no repositório

### Requirement: Mensagem de erro da API
Quando a API responder com erro no formato Problem Details, o front SHALL mostrar ao usuário uma mensagem em pt-BR: o `detail` quando presente, senão o `title`.

#### Scenario: Regra de negócio violada
- **WHEN** a API responde `400` com `detail` "A branch base e a branch de implementação devem ser diferentes."
- **THEN** o usuário MUST ver exatamente essa mensagem

#### Scenario: Erro sem detalhe
- **WHEN** a API responde `404` com `title` "Recurso não encontrado." e sem `detail`
- **THEN** o usuário MUST ver "Recurso não encontrado."

#### Scenario: Asana indisponível
- **WHEN** a API responde `502` com `detail` sobre a falha de comunicação com o Asana
- **THEN** o usuário MUST ver essa mensagem, sem detalhes técnicos adicionais

### Requirement: Erros de validação por campo
Quando a API responder com erros de validação (`errors`), o front SHALL disponibilizar as mensagens associadas a cada campo do formulário correspondente, aceitando as chaves da API em PascalCase.

#### Scenario: Campo obrigatório ausente
- **WHEN** a API responde `400` com `errors` `{ "PrazoInterno": ["O prazo interno é obrigatório."] }`
- **THEN** a mensagem "O prazo interno é obrigatório." MUST ficar disponível para o campo `prazoInterno`

### Requirement: API indisponível
Quando a API não puder ser alcançada (falha de rede ou servidor desligado), o front SHALL mostrar uma mensagem em pt-BR informando que a Actum API está indisponível, sem detalhes técnicos.

#### Scenario: API desligada
- **WHEN** o usuário abre o front com a API desligada
- **THEN** o usuário MUST ver uma mensagem informando que não foi possível conectar à Actum API

#### Scenario: Resposta inesperada
- **WHEN** a API responde com erro sem corpo Problem Details
- **THEN** o usuário MUST ver uma mensagem genérica de erro inesperado em pt-BR

### Requirement: Datas sem horário
Datas sem horário recebidas da API no formato `yyyy-MM-dd` MUST ser exibidas e enviadas com o mesmo dia, independentemente do fuso horário da máquina.

#### Scenario: Prazo exibido no Brasil
- **WHEN** a API devolve `prazoInterno = 2026-11-04` e a máquina está no fuso de São Paulo
- **THEN** o front MUST exibir `04/11/2026`

#### Scenario: Prazo enviado
- **WHEN** o usuário escolhe o dia 7 de novembro de 2026 como prazo
- **THEN** o front MUST enviar `2026-11-07`

### Requirement: Datas com horário
Datas com horário recebidas da API, que vêm no horário local e sem fuso, MUST ser exibidas no mesmo horário, em formato brasileiro.

#### Scenario: Data da última sincronização
- **WHEN** a API devolve `iniciadaEm = 2026-11-03T14:30:15.123`
- **THEN** o front MUST exibir `03/11/2026 14:30`
