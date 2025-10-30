const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

// Marks appointments whose end time has passed and are still pending/confirmed as 'no-show'
const markMissedAppointments = async () => {
  try {
    const now = new Date();

    // Fetch candidates in batches to avoid large memory usage
    const batchSize = 500;
    let page = 0;
    let processed = 0;

    // Loop until no more results
    // We filter by statuses first for efficiency
    while (true) {
      const appointments = await Appointment.find({
        status: { $in: ["pending", "confirmed"] },
      })
        .sort({ appointmentDate: 1 })
        .skip(page * batchSize)
        .limit(batchSize);

      if (appointments.length === 0) break;

      const updates = [];

      for (const apt of appointments) {
        const end = new Date(apt.appointmentDate);
        const [endH, endM] = String(apt.endTime || "00:00")
          .split(":")
          .map((n) => parseInt(n, 10));
        end.setHours(endH || 0, endM || 0, 0, 0);

        if (end < now) {
          updates.push(apt._id);
        }
      }

      if (updates.length > 0) {
        await Appointment.updateMany(
          { _id: { $in: updates } },
          { $set: { status: "no-show" } }
        );
        processed += updates.length;
      }

      page += 1;
    }

    if (processed > 0) {
      console.log(
        `✅ Marked ${processed} past unattended appointments as no-show`
      );
    }
  } catch (error) {
    console.error("Error marking missed appointments:", error);
  }
};

module.exports = { markMissedAppointments };
