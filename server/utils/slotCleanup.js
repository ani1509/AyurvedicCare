const Slot = require("../models/Slot");

const cleanupExpiredSlots = async () => {
  try {
    const now = new Date();

    // Find all expired locked slots
    const expiredSlots = await Slot.find({
      status: "locked",
      "lockedBy.expiresAt": { $lt: now },
    });

    if (expiredSlots.length > 0) {
      console.log(`Cleaning up ${expiredSlots.length} expired slots`);

      // Unlock all expired slots
      const unlockPromises = expiredSlots.map((slot) => slot.unlockSlot());
      await Promise.all(unlockPromises);

      console.log(
        `Successfully cleaned up ${expiredSlots.length} expired slots`
      );
    }
  } catch (error) {
    console.error("Error cleaning up expired slots:", error);
  }
};

module.exports = { cleanupExpiredSlots };
