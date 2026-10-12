import { answerById } from './answerById.js';

// /answer <id> <текст>
export async function answerCommand(args) {
  const [id, ...words] = args;
  const answer = words.join(' ');
  if (!id || !answer) return 'Формат: /answer <id> <текст ответа>';
  return answerById(id, answer);
}
