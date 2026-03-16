const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: "DOCTOR" },
      select: { id: true, email: true },
      take: 5,
    });

    console.log("Available doctors:");
    doctors.forEach((doc) => {
      console.log(`  ID: ${doc.id}, Email: ${doc.email}`);
    });

    if (doctors.length > 0) {
      console.log(`\nTesting with doctor: ${doctors[0].id}`);
      console.log(
        `URL: http://localhost:3001/api/schedule/availability?doctorId=${doctors[0].id}&date=2026-03-30`,
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
