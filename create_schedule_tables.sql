CREATE TABLE IF NOT EXISTS "WorkingHours" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "doctorId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkingHours_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User" ("id") ON DELETE CASCADE,
  UNIQUE("doctorId", "dayOfWeek")
);

CREATE TABLE IF NOT EXISTS "BlockedSlot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "doctorId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlockedSlot_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "WorkingHours_doctorId_idx" ON "WorkingHours"("doctorId");
CREATE INDEX IF NOT EXISTS "BlockedSlot_doctorId_idx" ON "BlockedSlot"("doctorId");
CREATE INDEX IF NOT EXISTS "BlockedSlot_date_idx" ON "BlockedSlot"("date");
