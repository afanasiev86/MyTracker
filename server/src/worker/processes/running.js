// Общий реестр работающих процессов: taskId -> { child, reason, killTimer }
export const running = new Map();
