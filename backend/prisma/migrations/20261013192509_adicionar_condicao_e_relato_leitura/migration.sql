-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Livro" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "isbn" TEXT,
    "anoPublicacao" INTEGER,
    "editora" TEXT,
    "capaId" INTEGER,
    "descricao" TEXT,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "condicao" TEXT NOT NULL DEFAULT 'BOM_ESTADO',
    "relatoLeitura" TEXT,
    "usuarioId" INTEGER NOT NULL,
    CONSTRAINT "Livro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Livro" ("anoPublicacao", "autor", "capaId", "descricao", "disponivel", "editora", "id", "isbn", "titulo", "usuarioId") SELECT "anoPublicacao", "autor", "capaId", "descricao", "disponivel", "editora", "id", "isbn", "titulo", "usuarioId" FROM "Livro";
DROP TABLE "Livro";
ALTER TABLE "new_Livro" RENAME TO "Livro";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
