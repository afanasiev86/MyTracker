// Приём результата проверки (кнопка «Принять» в Telegram и в интерфейсе)
export async function acceptTask(task) {
  if (task.status !== 'review') {
    return { error: 'Принять можно только задачу на проверке' };
  }
  task.status = 'done';
  await task.save();
  return { task };
}
