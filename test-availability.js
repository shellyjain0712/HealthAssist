const https = require("http");

const options = {
  hostname: "localhost",
  port: 3001,
  path: "/api/schedule/availability?doctorId=cmkaq2wh300027jnpyyyb06er&date=2026-03-30",
  method: "GET",
};

const req = https.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const result = JSON.parse(data);
      console.log("\n=== AVAILABILITY API TEST RESULT ===\n");

      // Find the 2026-03-30 schedule
      const scheduleFor30th = result.schedule.find(
        (s) => s.date === "2026-03-30",
      );

      if (!scheduleFor30th) {
        console.log("❌ ERROR: No schedule found for 2026-03-30");
        console.log(
          "Available dates:",
          result.schedule.map((s) => s.date).join(", "),
        );
        process.exit(1);
      }

      console.log(
        `Date: ${scheduleFor30th.date} (${scheduleFor30th.dayOfWeek})`,
      );
      console.log(`Total slots: ${scheduleFor30th.slots.length}`);
      console.log("\nSlot Details:");

      let found9AM = false;
      scheduleFor30th.slots.forEach((slot) => {
        const status = slot.isAvailable ? "✅ AVAILABLE" : "❌ BOOKED";
        const reason = slot.reason ? ` (${slot.reason})` : "";
        console.log(`  ${slot.time.padEnd(10)} - ${status}${reason}`);

        if (slot.time === "9:00 AM") {
          found9AM = true;
          if (
            !slot.isAvailable &&
            slot.reason === "Booked by another patient"
          ) {
            console.log(
              "\n✅ SUCCESS: 9:00 AM slot is correctly marked as BOOKED!",
            );
          } else {
            console.log(
              `\n❌ FAILURE: 9:00 AM slot should be booked but is: ${slot.isAvailable ? "AVAILABLE" : "BOOKED"}`,
            );
            if (slot.reason) console.log(`   Reason: ${slot.reason}`);
            process.exit(1);
          }
        }
      });

      if (!found9AM) {
        console.log("\n❌ ERROR: 9:00 AM slot not found in response");
        process.exit(1);
      }
    } catch (error) {
      console.error("❌ Error parsing response:", error.message);
      console.error("Response:", data);
      process.exit(1);
    }
  });
});

req.on("error", (error) => {
  console.error("❌ Request failed:", error.message);
  process.exit(1);
});

req.end();
