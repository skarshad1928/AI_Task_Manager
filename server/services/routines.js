const WATER_ROUTINES = [
  { title: "Drink 1 liter water", time: "10:00" },
  { title: "Drink 1 liter water", time: "17:00" },
];

async function ensureWaterRoutines(Task, date) {
  for (const routine of WATER_ROUTINES) {
    if (await Task.exists({ date, type: "water", time: routine.time })) continue;
    try {
      await Task.create({ ...routine, date, type: "water" });
    } catch (error) {
      // Concurrent requests can create the same scheduled task at once.
      if (error.code !== 11000) throw error;
    }
  }
}

module.exports = { ensureWaterRoutines, WATER_ROUTINES };
