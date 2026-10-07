const SCORE_MAX = Object.freeze({ water: 20, routine: 20, study: 30, sleep: 20, focus: 10 });

function calculateDailyScore(tasks, sleep) {
  const waterTasks = tasks.filter((task) => task.type === "water");
  const routines = tasks.filter((task) => task.type === "routine");
  const studyTasks = tasks.filter((task) => task.type === "study" || task.type === "immediate");
  const completedWater = waterTasks.filter((task) => task.done).length;
  const completedRoutines = routines.filter((task) => task.done).length;
  const completedStudy = studyTasks.filter((task) => task.done).length;
  const focusSeconds = studyTasks.reduce((sum, task) => sum + (Number(task.timeSpentSec) || 0), 0);

  const bedtimeHour = sleep?.bedtime ? Number(sleep.bedtime.slice(0, 2)) : null;
  const wentToBedBeforeMidnight = bedtimeHour != null && bedtimeHour >= 18 && bedtimeHour < 24;
  const sleepPoints = sleep
    ? (sleep.hours >= 7 && sleep.hours <= 9 ? 10 : 0) + (wentToBedBeforeMidnight ? 10 : 0)
    : 0;

  const breakdown = {
    water: Math.min(SCORE_MAX.water, completedWater * 10),
    // Custom routines are a separate task type; water goals never enter this category.
    routine: routines.length ? Math.round((completedRoutines / routines.length) * SCORE_MAX.routine) : SCORE_MAX.routine,
    study: studyTasks.length ? Math.round((completedStudy / studyTasks.length) * SCORE_MAX.study) : 0,
    sleep: sleepPoints,
    focus: Math.min(SCORE_MAX.focus, Math.round((focusSeconds / 3600) * SCORE_MAX.focus)),
  };

  return { breakdown, score: Object.values(breakdown).reduce((sum, value) => sum + value, 0) };
}

module.exports = { calculateDailyScore, SCORE_MAX };
