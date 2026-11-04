## ADDED Requirements

### Requirement: Extensões do Problem Details
Quando a API responder em Problem Details com campos além de `type`, `title`, `status`, `detail`, `instance`, `traceId` e `errors`, o `ErroDaApi` SHALL guardá-los em `extensoes`, com os nomes como vieram, para a tela usar (por exemplo, `anexosEnviados`).

#### Scenario: Envio parcial ao Asana
- **WHEN** a API responde `502` com `detail` e `anexosEnviados` `["print.png"]`
- **THEN** o erro MUST ter a mensagem do `detail` e `extensoes.anexosEnviados` igual a `["print.png"]`

#### Scenario: Sem extensões
- **WHEN** a API responde `404` só com `title` e `detail`
- **THEN** `extensoes` MUST ser um objeto vazio
