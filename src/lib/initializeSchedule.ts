import { prisma } from "@/lib/prisma";

async function initializeScheduleTables() {
  try {
    console.log("Initializing schedule tables...");

    // Create WorkingHours table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WorkingHours" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "doctorId" TEXT NOT NULL,
        "dayOfWeek" INTEGER NOT NULL,
        "startTime" TEXT NOT NULL,
        "endTime" TEXT NOT NULL,
        "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "WorkingHours_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User" ("id") ON DELETE CASCADE
      )
    `);

    // Add unique constraint
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "WorkingHours_doctorId_dayOfWeek_key" ON "WorkingHours"("doctorId", "dayOfWeek")
    `);

    // Create BlockedSlot table
    await prisma.$executeRawUnsafe(`
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
      )
    `);

    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "WorkingHours_doctorId_idx" ON "WorkingHours"("doctorId")
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "BlockedSlot_doctorId_idx" ON "BlockedSlot"("doctorId")
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "BlockedSlot_date_idx" ON "BlockedSlot"("date")
    `);

    console.log("✓ Schedule tables initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing schedule tables:", error);
    return false;
  }
}

export default initializeScheduleTables;
