# 📚 Reconecta — Doação e Circulação de Livros

Aplicação Full Stack completa desenvolvida em **Node.js, Express, Prisma ORM, SQLite e React**, com o objetivo de apoiar a doação, troca e circulação contínua de livros entre leitores.

O projeto foi construído como parte do programa acadêmico da **Recode**, diretamente alinhado ao **ODS 4 da ONU (Educação de Qualidade)**, promovendo a democratização do acesso à leitura e incentivando que livros parados em estantes ganhem novos leitores.

---

## 🎯 Objetivo e Proposta de Valor

A proposta do **Reconecta** é criar uma ponte comunitária entre quem deseja doar livros e quem busca novas leituras. 

O sistema integra-se à **Open Library API** para buscar automaticamente dados bibliográficos e capas oficiais, permitindo que o doador complemente apenas as informações do exemplar físico real (estado de conservação e relato pessoal de leitura).

Além disso, a plataforma conta com uma **lógica de circulação**: quando um usuário resgata um exemplar, o livro passa para a sua posse e sai da Estante Geral. Ao terminar a leitura, o leitor pode recolocá-lo para circular novamente!

---

## 🛠️ Tecnologias Utilizadas

### Back-End
- **Node.js** — ambiente de execução JavaScript;
- **Express** — criação do servidor REST e middlewares;
- **Prisma ORM** — modelagem e comunicação com o banco de dados;
- **SQLite** — banco de dados relacional leve e embutido;
- **bcryptjs** — geração e validação de hashes seguros de senhas;
- **jsonwebtoken (JWT)** — autenticação e emissão de tokens de acesso;
- **CORS** — liberação de comunicação entre o front-end e a API;
- **Fetch API nativa** — integração com o catálogo da Open Library.

### Front-End
- **React** (com **Vite**) — interface modular, moderna e rápida;
- **React Router Dom** — roteamento de páginas sem recarregamento;
- **Lucide React** — ícones em vetor leves e consistentes;
- **CSS3 Design System** — layout responsivo com suporte a **Modo Claro** e **Modo Escuro (Dark Mode)**.

---

## 🏗️ Arquitetura do Repositório (Monorepo)

O projeto é organizado de forma modular, separando claramente as responsabilidades de cliente e servidor:

```text
api-doacao-livros/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Modelos Usuario e Livro
│   │   ├── migrations/         # Histórico de migrações SQL
│   │   └── seed.js             # Semeador de usuários com hash e ADMIN inicial
│   ├── .env.example            # Modelo das variáveis de ambiente
│   ├── package.json
│   └── server.js               # Rotas, validações (Fail Fast) e middlewares JWT
├── frontend/
│   ├── src/
│   │   ├── components/         # Header, Footer, BookCard, SearchBar, Sidebar
│   │   ├── pages/              # Home, Login, RegisterUser, RegisterBook
│   │   ├── services/api.js     # Cliente HTTP com injeção automática de JWT
│   │   ├── App.jsx             # Roteamento e persistência de tema
│   │   └── index.css           # Estilos globais e tokens de cores
│   └── package.json
├── .gitignore
├── README.md
└── API Doação de Livros.postman_collection.json
```

---

## 🔒 Autenticação e Regras de Permissão (RBAC)

O sistema conta com dois níveis de acesso baseados em papéis:
- **`USER` (Leitor Comum):** Pode consultar a estante pública, cadastrar doações em seu próprio nome, pegar livros disponíveis e editar/excluir somente os exemplares sob sua posse.
- **`ADMIN` (Administrador):** Possui permissão de moderação do acervo, podendo editar ou excluir livros de qualquer usuário.

### Medidas de Segurança Adotadas:
1. **Hash de senhas:** Nenhuma senha é salva em texto puro. Utiliza-se `bcryptjs` com salt round de 10.
2. **Proteção contra enumeração:** Respostas de erro no login utilizam mensagens genéricas (`401 Credenciais inválidas.`).
3. **Prevenção de escalonamento:** O cadastro público de usuários força sempre o papel `USER`, mesmo que o cliente tente injetar `role: "ADMIN"`.
4. **Criação controlada do Administrador:** O primeiro admin é gerado através de script seguro de seed (`backend/prisma/seed.js`).
5. **Dados protegidos:** Respostas da API nunca expõem senhas ou hashes criptográficos.

---

## 📖 Ciclo de Vida do Livro: Catálogo x Exemplar

O projeto separa com clareza os conceitos de domínio:
1. **Dados Bibliográficos:** Título, autor, ano de publicação, capa oficial e ISBN. São obtidos via integração com a Open Library e não podem ser adulterados no exemplar.
2. **Exemplar Físico:** É a cópia real disponibilizada pelo doador, possuindo:
   - `condicao`: Estado físico (`NOVO`, `SEMINOVO`, `BOM_ESTADO`, `MARCAS_DE_USO`, `DESGASTADO`);
   - `relatoLeitura`: Depoimento do leitor sobre o impacto da obra (máx. 2.000 caracteres);
   - `disponivel`: Status de circulação (`true` para livre na estante; `false` quando resgatado).

---

## 📍 Endpoints da API

### Autenticação & Usuários
* `POST /usuarios`: Cadastro público de novo leitor comum.
* `POST /auth/login`: Autentica o usuário e emite o token JWT.
* `GET /auth/me`: Retorna os dados do leitor autenticado (requer token).
* `PATCH /usuarios/perfil`: Atualiza a personalização do leitor (bio, foto e cor do banner).

### Catálogo Externo (Open Library)
* `GET /livros/buscar?titulo=nome-do-livro`: Consulta edições em português com retorno normalizado.
* `GET /livros/buscar/isbn/:isbn`: Busca detalhada por código ISBN-10 ou ISBN-13 (com ou sem hífens).

### Gerenciamento de Livros
* `GET /livros`: Retorna todos os livros atualmente disponíveis para resgate na Estante Geral.
* `GET /livros/meus`: Retorna os livros associados ao usuário logado (requer token).
* `POST /livros`: Cadastra um exemplar para doação, vinculando ao `usuarioId` do token.
* `PATCH /livros/:id`: Edita os dados do exemplar (condição e relato) ou realiza a ação de resgate (`{ "acao": "pegar" }`).
* `DELETE /livros/:id`: Remove um exemplar (permitido apenas ao proprietário ou ao administrador).

---

## 🚀 Instalação e Execução

### Pré-requisitos
- **Node.js** (v18 ou superior) instalado.

---

### 1. Clonar o Repositório
```bash
git clone https://github.com/leafrrs/api-doacao-livros.git
cd api-doacao-livros
```

### 2. Configurar e Iniciar o Back-End
Entre na pasta do backend:
```bash
cd backend
npm install
```

Crie o arquivo `.env` dentro da pasta `backend/`:
```env
DATABASE_URL="file:./dev.db"
PORT=3000
JWT_SECRET=sua_chave_secreta_jwt_para_desenvolvimento
JWT_EXPIRES_IN=1d
```

Execute as migrações do banco SQLite e popule os usuários iniciais com o seed:
```bash
npx prisma migrate dev
node prisma/seed.js
```

Inicie o servidor da API:
```bash
npm start
```
*O servidor estará operando em: `http://localhost:3000`*

---

### 3. Iniciar o Front-End
Em uma nova janela de terminal, entre na pasta do frontend:
```bash
cd frontend
npm install
npm run dev
```
*A interface web estará disponível em: `http://localhost:5173`*

---

## 💻 Interface Front-End (Wireframe Implementado)

A interface do usuário foi projetada com base em wireframe modular, contando com:
- **Painel Lateral do Leitor:** Avatar com profundidade, bio customizável, seletor de paleta de cores para o banner superior e 3 abas interativas (**Pegos**, **Doados** e **Favoritos**);
- **Lista de Desejos (Favoritos):** Permite favoritar livros com 1 clique no coração ❤️ e ativa alertas de notificação;
- **Vitrine Central:** Estante Geral fluida com cards de livros, capas dinâmicas e badges de condição física;
- **Autocomplete Inteligente:** Na tela de doação, a pesquisa no catálogo sugere obras em tempo real conforme a digitação;
- **Notificações Flutuantes (Toasts):** Mensagens de sucesso ou erro que surgem sem empurrar os elementos da tela e desaparecem sozinhas após 5 segundos.

---

## 📮 Collection do Postman

Para facilitar a validação e homologação dos contratos de API, o arquivo atualizado da Collection está disponível na raiz do repositório:
```text
API Doação de Livros.postman_collection.json
```
Basta importá-lo no Postman para testar os fluxos de Login, Cadastro, Consultas, Atualizações Parciais e Exclusões protegidas.

---

## 🚧 Limitações e Próximos Passos

Como evolução contínua da aplicação, estão mapeadas para as próximas versões:
- Integração real com serviços de mensageria para envio de e-mails (ex: Nodemailer/SendGrid) e WhatsApp API para a lista de desejos;
- Paginação com rolagem infinita na Estante Geral;
- Separação da arquitetura do backend no padrão MVC (Controllers, Services e Repositories);
- Upload direto de imagens de capa para armazenamento em nuvem (ex: AWS S3 ou Cloudinary).

---

## 🌱 ODS 4 — Educação de Qualidade

Este projeto apoia diretamente o **Objetivo de Desenvolvimento Sustentável 4 (Educação de Qualidade)** da Agenda 2030 da ONU, promovendo o acesso democrático ao conhecimento, o incentivo à leitura e a economia circular do livro didático e literário.

---

## 👨‍💻 Autor

**Rafael Rodrigues dos Santos**  
- 💼 **LinkedIn:** [rafael-rodrigues-dos-santos-rrs](https://www.linkedin.com/in/rafael-rodrigues-dos-santos-rrs)  
- 🐙 **GitHub:** [leafrrs](https://github.com/leafrrs)  
- ✉️ **E-mail:** [Rafael.r_rs@hotmail.com](mailto:Rafael.r_rs@hotmail.com)  

*Projeto desenvolvido durante o programa acadêmico da **Recode**.*
