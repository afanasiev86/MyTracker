import mongoose from 'mongoose';
import Task from '../../models/Task.js';

// Поиск задачи по ID из сообщения; некорректный ID — просто «не найдено»
export async function findTask(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Task.findById(id);
}
