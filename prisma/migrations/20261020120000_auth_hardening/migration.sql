-- Durcissement de l'authentification : verrouillage apres echecs repetes
-- et revocation des sessions ouvertes (ajouts uniquement, sans perte de donnees).
ALTER TABLE "users" ADD COLUMN "failedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "lockedUntil" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
