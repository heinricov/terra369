-- CreateTable
CREATE TABLE "Dth22" (
    "id" SERIAL NOT NULL,
    "unit_name" TEXT NOT NULL,
    "suhu" DOUBLE PRECISION NOT NULL,
    "kelembapan" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dth22_pkey" PRIMARY KEY ("id")
);
