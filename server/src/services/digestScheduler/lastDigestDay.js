import Settings from '../../models/Settings.js';

// День последней отправки хранится в базе, поэтому перезапуск не даёт повтора в тот же день
export async function lastDigestDay() {
  const doc = await Settings.findOne({ key: 'digest' }).lean();
  return doc?.digestDay ?? '';
}

export async function saveDigestDay(day) {
  await Settings.updateOne({ key: 'digest' }, { $set: { digestDay: day } }, { upsert: true });
}
