function ratio(tasks) {
  return tasks.length ? tasks.filter((task) => task.done).length / tasks.length : 0;
}

function calculateDailyScore(tasks, sleep, usage) {
  const water = tasks.filter((task) => task.type === "routine");
  const study = tasks.filter((task) => task.type === "study");
  const focusMinutes = study.reduce((total, task) => total + (task.timeSpentSec || 0), 0) / 60;

  let sleepScore = 0;
  if (sleep) {
    sleepScore = sleep.hours >= 7 && sleep.hours <= 9 ? 15 : sleep.hours >= 6 ? 10 : 5;
    const bedtimeHour = Number(sleep.bedtime?.split(":")[0]);
    if (bedtimeHour >= 21 && bedtimeHour <= 23) sleepScore += 5;
  }

  const breakdown = {
    water: Math.round(ratio(water) * 15),
    study: Math.round(ratio(study) * 25),
    sleep: sleepScore,
    focus: Math.min(10, Math.round((focusMinutes / 60) * 10)),
    routine: Math.round(ratio(water) * 10),
    digitalHabits: usage
      ? Math.max(0, 10 - (usage.youtubeMinutes > 120 ? 5 : 0) - (usage.chromeMinutes > 120 ? 5 : 0))
      : 0,
    waterBonus: water.length > 0 && water.every((task) => task.done) ? 10 : 0,
  };

  return { breakdown, score: Object.values(breakdown).reduce((total, points) => total + points, 0) };
}

module.exports = { calculateDailyScore };