-- ── Create NewsletterSubscribers Table ──────────────────────────────────────
CREATE TABLE "NewsletterSubscribers" (
    "Id" UUID NOT NULL,
    "Email" VARCHAR(320) NOT NULL,
    "SubscribedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "PK_NewsletterSubscribers" PRIMARY KEY ("Id")
);

-- Unique index on email for fast lookups and unique constraint
CREATE UNIQUE INDEX "UQ_NewsletterSubscribers_Email" ON "NewsletterSubscribers" ("Email");
