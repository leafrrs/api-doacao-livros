# 📚 API de Doação de Livros

API REST desenvolvida em **Node.js** para apoiar um sistema de doação e circulação de livros.

O projeto foi desenvolvido como parte do programa acadêmico da **Recode**, relacionado ao **ODS 4 — Educação de Qualidade**, com a proposta de facilitar o acesso à leitura por meio da conexão entre pessoas que possuem livros disponíveis para doação e pessoas interessadas nesses exemplares.

## 🎯 Objetivo do Projeto

A proposta do projeto é disponibilizar uma API capaz de cadastrar usuários e livros disponíveis para doação, além de utilizar uma fonte externa de dados bibliográficos para facilitar a identificação dos livros.

Para isso, a aplicação possui integração com a **Open Library API**, permitindo pesquisar informações de livros por título ou ISBN antes de cadastrar um exemplar no banco de dados local.

O projeto foi desenvolvido como um **MVP (Produto Mínimo Viável)**, priorizando as funcionalidades principais necessárias para demonstrar a proposta.

---

## 🛠️ Tecnologias Utilizadas

- **Node.js** — ambiente de execução JavaScript;
- **Express** — criação do servidor e das rotas da API;
- **Prisma ORM** — comunicação entre a aplicação e o banco de dados;
- **SQLite** — banco de dados relacional utilizado no projeto;
- **Fetch API** — comunicação com a Open Library;
- **Postman** — testes e documentação das requisições da API.

---

## 🏗️ Estrutura do MVP

Para manter o projeto simples e adequado ao escopo acadêmico, as rotas, validações e regras de negócio estão concentradas no arquivo principal `server.js`.

O **Prisma ORM** faz a comunicação entre a aplicação e o banco de dados SQLite.

O fluxo principal da aplicação pode ser representado da seguinte maneira:

```text
Usuário pesquisa um livro
          ↓
       API local
          ↓
     Open Library
          ↓
Dados bibliográficos
          ↓
Usuário confirma o exemplar
          ↓
     POST /livros
          ↓
        Prisma
          ↓
        SQLite
```

---

## 📖 Catálogo Bibliográfico x Exemplar

Durante o desenvolvimento, foi importante diferenciar dois conceitos.

### Catálogo Bibliográfico

Representa os dados bibliográficos da edição de um livro, como:

- título;
- autor;
- ISBN;
- ano de publicação;
- editora;
- identificador da capa.

Essas informações podem ser obtidas através da **Open Library**.

### Exemplar

Representa a cópia física que um usuário possui e deseja disponibilizar para doação.

Além dos dados bibliográficos, o exemplar possui informações relacionadas ao sistema, como:

- `usuarioId` — usuário responsável pelo exemplar;
- `descricao` — informações sobre o estado de conservação;
- `disponivel` — indica se o exemplar está disponível.

Para manter o MVP simples, os dados bibliográficos e os dados do exemplar são armazenados em um único registro de livro no banco local.

---

## 🌐 Integração com Open Library

A aplicação utiliza a **Open Library API** como fonte externa de informações bibliográficas.

A integração permite realizar dois tipos de busca.

### Busca por título

```http
GET /livros/buscar?titulo=senhor+dos+aneis
```

A API consulta a Open Library e retorna até **5 resultados**, contendo somente os dados necessários para o projeto.

Exemplo de resposta:

```json
[
  {
    "titulo": "O Senhor dos Anéis",
    "autor": "J.R.R. Tolkien",
    "ano_publicacao": 2002,
    "isbn": "9780000000000",
    "capa_id": 123456
  }
]
```

### Busca por ISBN

```http
GET /livros/buscar/isbn/9780140328721
```

A rota aceita **ISBN-10 ou ISBN-13**.

Caso o ISBN seja informado com hífens, como:

```text
978-0-14-032872-1
```

a API remove os hífens antes de realizar a consulta à Open Library.

Como o ISBN identifica uma edição específica, a resposta contém apenas um livro quando a edição é encontrada.

Exemplo:

```json
{
  "titulo": "Fantastic Mr. Fox",
  "autor": "Roald Dahl",
  "isbn": "9780140328721",
  "ano_publicacao": 1988,
  "editora": "Puffin Books",
  "capa_id": 8259441
}
```

---

## 📚 Endpoints

### 👤 Criar usuário

```http
POST /usuarios
```

Campos obrigatórios:

- `nome`;
- `email`;
- `senha`.

Exemplo:

```json
{
  "nome": "João das Letras",
  "email": "joao@email.com",
  "senha": "123456"
}
```

A API verifica se os campos obrigatórios foram enviados antes de chamar o Prisma.

---

### 📖 Cadastrar livro para doação

```http
POST /livros
```

Campos obrigatórios:

- `titulo`;
- `autor`;
- `usuarioId`.

Os demais dados bibliográficos e a descrição do exemplar são opcionais.

Exemplo:

```json
{
  "titulo": "Fantastic Mr. Fox",
  "autor": "Roald Dahl",
  "descricao": "Livro em ótimo estado.",
  "usuarioId": 1,
  "isbn": "9780140328721",
  "anoPublicacao": 1988,
  "editora": "Puffin Books",
  "capaId": 8259441
}
```

Quando cadastrado com sucesso, o servidor retorna:

```http
201 Created
```

---

### 📚 Listar livros

```http
GET /livros
```

Retorna os exemplares cadastrados na Estante Geral.

Na relação com o dono do exemplar, a API retorna apenas:

- `id`;
- `nome`.

Exemplo:

```json
{
  "id": 2,
  "titulo": "Fantastic Mr. Fox",
  "autor": "Roald Dahl",
  "isbn": "9780140328721",
  "anoPublicacao": 1988,
  "editora": "Puffin Books",
  "capaId": 8259441,
  "descricao": "Livro em ótimo estado.",
  "disponivel": true,
  "usuarioId": 1,
  "dono": {
    "id": 1,
    "nome": "João das Letras"
  }
}
```

Dados como senha e e-mail do usuário não são incluídos nessa resposta.

---

### 🔎 Buscar por título na Open Library

```http
GET /livros/buscar?titulo=nome-do-livro
```

Retorna até 5 resultados da Open Library relacionados ao título pesquisado.

---

### 🔎 Buscar por ISBN na Open Library

```http
GET /livros/buscar/isbn/:isbn
```

Exemplo:

```http
GET /livros/buscar/isbn/9780140328721
```

Retorna os dados bibliográficos da edição encontrada.

---

### 🗑️ Remover livro

```http
DELETE /livros/:id
```

Exemplo:

```http
DELETE /livros/2
```

A API verifica se o ID informado é válido antes de consultar o banco.

Caso o livro não exista, retorna:

```http
404 Not Found
```

---

## ⚠️ Validações e Tratamento de Erros

A API possui validações básicas de entrada e tratamento de erros para responder de forma adequada a situações esperadas e falhas durante a execução.

Alguns dos status HTTP utilizados são:

### `400 Bad Request`

Utilizado quando a requisição possui dados inválidos, por exemplo:

- campos obrigatórios ausentes;
- ID em formato inválido;
- ISBN com tamanho inválido;
- requisição sem título para pesquisa.

### `404 Not Found`

Utilizado quando um recurso solicitado não é encontrado, por exemplo:

- tentativa de remover um livro inexistente;
- ISBN não encontrado na Open Library.

### `500 Internal Server Error`

Utilizado para falhas inesperadas durante a execução ou problemas na comunicação com serviços externos.

Nas consultas à Open Library, a aplicação verifica o status HTTP da resposta antes de processar os dados.

Erros técnicos são registrados no console do servidor durante o desenvolvimento, enquanto a resposta enviada ao cliente evita expor detalhes internos do Prisma ou do banco de dados.

---

## 🚀 Instalação e Execução

### Pré-requisitos

É necessário possuir o **Node.js** instalado.

### 1. Clone o repositório

```bash
git clone https://github.com/leafrrs/api-doacao-livros.git
```

Entre na pasta:

```bash
cd api-doacao-livros
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Prepare o banco de dados

Execute as migrations existentes do Prisma:

```bash
npx prisma migrate dev
```

### 4. Inicie a aplicação

```bash
node server.js
```

O servidor ficará disponível em:

```text
http://localhost:3000
```

---

## 🗃️ Banco de Dados

O projeto utiliza **SQLite** através do Prisma ORM.

O modelo `Livro` armazena tanto informações bibliográficas quanto informações relacionadas ao exemplar físico.

Entre os campos utilizados estão:

```text
titulo
autor
isbn
anoPublicacao
editora
capaId
descricao
disponivel
usuarioId
```

O campo `usuarioId` estabelece a relação entre o exemplar e o usuário responsável por ele.

As alterações na estrutura do banco são controladas através das **migrations do Prisma**.

---

## 📮 Collection do Postman

Para facilitar os testes da API, o projeto possui uma Collection do Postman exportada na raiz do repositório:

```text
API Doação de Livros.postman_collection.json
```

Para utilizá-la:

1. abra o Postman;
2. escolha a opção **Import**;
3. selecione o arquivo da Collection;
4. inicie o servidor local;
5. execute as requisições disponíveis.

A Collection contém as requisições utilizadas durante o desenvolvimento e os testes das principais rotas da API.

---

## 🚧 Limitações e Próximos Passos

Este projeto foi desenvolvido como um **MVP acadêmico**, portanto algumas funcionalidades foram mantidas fora do escopo atual.

Entre possíveis evoluções estão:

- armazenamento seguro de senhas utilizando hash;
- autenticação e autorização de usuários;
- separação da aplicação em camadas, como controllers e services;
- paginação da Estante Geral;
- interface front-end;
- evolução do fluxo de solicitação e conclusão das doações.

Esses pontos podem ser desenvolvidos futuramente sem alterar o objetivo principal deste MVP.

---

## 🌱 ODS 4 — Educação de Qualidade

O projeto foi desenvolvido a partir do **Objetivo de Desenvolvimento Sustentável 4**, relacionado à Educação de Qualidade.

A proposta de circulação e doação de livros busca contribuir para o acesso a materiais de leitura e aprendizado, reaproveitando exemplares que poderiam permanecer sem utilização.

---

## 👨‍💻 Autor

**Rafael Rodrigues dos Santos**

Projeto desenvolvido durante o programa da **Recode**.
