#!/usr/bin/env node
const http = require("http");

console.log("\n🧪 Testing Appointment Confirmation Email\n");

// Test data based on your database
const testData = {
  patientEmail: "shellyjain0045@gmail.com",
  patientName: "Shelly Jain",
  doctorName: "Dr. Bhatija",
  doctorSpecialty: "Cardiologist",
  appointmentDate: new Date().toISOString(),
  appointmentTime: "9:00 AM",
  appointmentReason: "Heart checkup",
  consultationFee: 500,
};

const postData = JSON.stringify(testData);

const options = {
  hostname: "localhost",
  port: 3001,
  path: "/api/debug/send-email",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
  },
};

console.log("📧 Email Details:");
console.log(`   To: ${testData.patientEmail}`);
console.log(`   Patient: ${testData.patientName}`);
console.log(`   Doctor: ${testData.doctorName}`);
console.log(`   Time: ${testData.appointmentTime}`);
console.log(`   Fee: ₹${testData.consultationFee}`);
console.log("\n🔄 Sending test email...\n");

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const result = JSON.parse(data);

      if (res.statusCode === 200) {
        console.log("✅ SUCCESS!\n");
        console.log(`Message: ${result.message}`);
        console.log(`Email sent to: ${result.email}`);
        console.log(
          "\n📬 Check your inbox at shellyjain0045@gmail.com for the confirmation email!\n",
        );
      } else {
        console.log("❌ FAILED!\n");
        console.log(`Error: ${result.error}`);
        if (result.details) {
          console.log(`Details: ${result.details}`);
        }
        console.log("\n");
      }
    } catch (error) {
      console.error("Error parsing response:", error);
    }
  });
});

req.on("error", (error) => {
  console.error("❌ Request failed:", error.message);
  console.log("\nMake sure the dev server is running on port 3001");
});

req.write(postData);
req.end();
