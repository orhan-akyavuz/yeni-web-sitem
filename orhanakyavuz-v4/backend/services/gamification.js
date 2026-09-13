function getWeekKey(date = new Date()) {
  const day = date.getUTCDay() || 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - day + 1);
  return monday.toISOString().slice(0, 10);
}

function getPreviousWeekKey(weekKey) {
  const previous = new Date(`${weekKey}T00:00:00.000Z`);
  previous.setUTCDate(previous.getUTCDate() - 7);
  return previous.toISOString().slice(0, 10);
}

export function updateStreakAndBadges(db, userId) {
  const weekKey = getWeekKey();
  const previousWeekKey = getPreviousWeekKey(weekKey);
  const existing = db.prepare('SELECT current_streak, longest_streak, last_participation_week FROM streaks WHERE user_id = ?').get(userId);

  let currentStreak = existing?.current_streak ?? 0;
  let longestStreak = existing?.longest_streak ?? 0;
  if (existing?.last_participation_week !== weekKey) {
    currentStreak = existing?.last_participation_week === previousWeekKey ? currentStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, currentStreak);
    db.prepare(`
      INSERT INTO streaks (user_id, current_streak, longest_streak, last_participation_week)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET current_streak = excluded.current_streak,
        longest_streak = excluded.longest_streak, last_participation_week = excluded.last_participation_week,
        updated_at = datetime('now')
    `).run(userId, currentStreak, longestStreak, weekKey);
  }

  const score = db.prepare('SELECT COALESCE(SUM(points), 0) AS total FROM score_events WHERE user_id = ?').get(userId).total;
  const badgeCandidates = db.prepare(`
    SELECT id, code, criteria_type, criteria_value FROM badges WHERE is_active = 1
  `).all();
  const awarded = [];
  for (const badge of badgeCandidates) {
    const qualifies = badge.criteria_type === 'streak'
      ? currentStreak >= badge.criteria_value
      : badge.criteria_type === 'score' && score >= badge.criteria_value;
    if (!qualifies) continue;
    const result = db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)').run(userId, badge.id);
    if (result.changes > 0) awarded.push(badge.code);
  }

  return { currentStreak, longestStreak, score, awarded };
}

export function seedBadges(db) {
  db.prepare(`
    INSERT OR IGNORE INTO badges (code, name, description, icon, criteria_type, criteria_value)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('streak-3', 'Üç Haftalık Seri', 'Üç hafta üst üste katıldın.', '🔥', 'streak', 3);
  db.prepare(`
    INSERT OR IGNORE INTO badges (code, name, description, icon, criteria_type, criteria_value)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('score-50', 'İlk 50 Puan', 'Toplam 50 puana ulaştın.', '⭐', 'score', 50);
}