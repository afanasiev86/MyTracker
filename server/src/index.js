import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';

const { PORT = 3001, MONGO_URL } = process.env;

if (!MONGO_URL) {
  console.error('MONGO_URL не задан. См. server/.env.example');
  process.exit(1);
}

await mongoose.connect(MONGO_URL);
createApp().listen(PORT, () => {
  console.log(`API запущен на порту ${PORT}`);
});
