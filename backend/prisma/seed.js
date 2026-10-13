const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando o seed do banco de dados...");

  // Gerando os hashes das senhas com salt round de 10
  const senhaAdminHash = await bcrypt.hash("Admin@1234", 10);
  const senhaLeitorHash = await bcrypt.hash("Leitor@1234", 10);

  // 1. Criar ou atualizar o Administrador inicial
  const admin = await prisma.usuario.upsert({
    where: { email: "admin@reconecta.com" },
    update: {
      role: "ADMIN",
      senha: senhaAdminHash,
    },
    create: {
      nome: "Administrador Reconecta",
      email: "admin@reconecta.com",
      senha: senhaAdminHash,
      role: "ADMIN",
    },
  });

  // 2. Criar ou atualizar um Usuário Comum de teste
  const leitor = await prisma.usuario.upsert({
    where: { email: "leitor@reconecta.com" },
    update: {
      role: "USER",
      senha: senhaLeitorHash,
    },
    create: {
      nome: "Leitor Teste",
      email: "leitor@reconecta.com",
      senha: senhaLeitorHash,
      role: "USER",
    },
  });

  console.log("Seed concluído com sucesso!");
  console.log(
    `- Administrador configurado: ${admin.email} (Role: ${admin.role})`,
  );
  console.log(
    `- Usuário comum configurado: ${leitor.email} (Role: ${leitor.role})`,
  );
}

main()
  .catch((e) => {
    console.error("Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
