# 📚 API de Doação de Livros

API REST desenvolvida como atividade da Recode, relacionada ao
ODS 4 — Educação de Qualidade.

## 🎯 Objetivo

Criar uma API para uma plataforma de doação e troca de livros usados,
permitindo cadastrar usuários e disponibilizar livros para doação.

## 🛠️ Tecnologias

- Node.js
- Express
- Prisma ORM
- SQLite
- Postman

## 🚀 Funcionalidades

- Cadastro de usuários
- Cadastro de livros
- Associação de livros aos seus donos
- Listagem de livros disponíveis
- Exclusão de livros

## 📡 Endpoints

POST /usuarios
POST /livros
GET /livros
DELETE /livros/:id

## ▶️ Como executar

1. Clone o repositório
2. Instale as dependências:

npm install

3. Configure o banco de dados
4. Execute as migrations do Prisma
5. Inicie a aplicação

## 🧪 Testando a API

O repositório contém uma collection do Postman com as requisições
utilizadas para testar os endpoints.

## 👨‍💻 Autor

Rafael Rodrigues dos Santos
