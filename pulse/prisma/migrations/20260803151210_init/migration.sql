-- CreateTable
CREATE TABLE "clients" (
    "client_hash" TEXT NOT NULL PRIMARY KEY,
    "config_mode" TEXT NOT NULL,
    "app_version" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "daily_metrics" (
    "date" DATETIME NOT NULL,
    "config_mode" TEXT NOT NULL,
    "app_version" TEXT NOT NULL,
    "active_clients_count" INTEGER NOT NULL,

    PRIMARY KEY ("date", "config_mode", "app_version")
);

-- CreateTable
CREATE TABLE "weekly_metrics" (
    "year_week" TEXT NOT NULL,
    "config_mode" TEXT NOT NULL,
    "app_version" TEXT NOT NULL,
    "active_clients_count" INTEGER NOT NULL,

    PRIMARY KEY ("year_week", "config_mode", "app_version")
);

-- CreateIndex
CREATE INDEX "clients_last_seen_at_idx" ON "clients"("last_seen_at");
