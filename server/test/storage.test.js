import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { putFile, readFile, fileStream, checkWritable } from '../src/services/storage/files.js';

describe('хранилище вложений на диске', () => {
  const saved = { ...process.env };
  let dir;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mt-uploads-'));
    process.env.ATTACHMENTS_DIR = dir;
  });
  afterEach(async () => {
    process.env = { ...saved };
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('записывает файл в папку задачи и читает обратно', async () => {
    await putFile('task1/a.png', Buffer.from('data'));
    expect((await readFile('task1/a.png')).toString()).toBe('data');
    expect(await fs.readdir(path.join(dir, 'task1'))).toEqual(['a.png']);
  });

  it('отдаёт файл потоком', async () => {
    await putFile('task1/a.png', Buffer.from('data'));
    const chunks = [];
    for await (const chunk of fileStream('task1/a.png')) chunks.push(chunk);
    expect(Buffer.concat(chunks).toString()).toBe('data');
  });

  it('создаёт папку при проверке и подтверждает запись', async () => {
    process.env.ATTACHMENTS_DIR = path.join(dir, 'new', 'nested');
    await expect(checkWritable()).resolves.toBeUndefined();
    expect((await fs.stat(process.env.ATTACHMENTS_DIR)).isDirectory()).toBe(true);
  });

  it('папка по умолчанию — uploads рядом с каталогом server', async () => {
    delete process.env.ATTACHMENTS_DIR;
    const { getConfig } = await import('../src/config.js');
    expect(getConfig().attachmentsDir).toBe(path.resolve(process.cwd(), '..', 'uploads'));
  });
});
