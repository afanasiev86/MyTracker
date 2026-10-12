import { providerStatus, PROVIDERS } from '../src/services/storage.js';

describe('хранилища вложений', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('MinIO настроен, когда заданы хост и ключи', () => {
    process.env.MINIO_ENDPOINT = 'minio.local';
    process.env.MINIO_ACCESS_KEY = 'key';
    process.env.MINIO_SECRET_KEY = 'secret';
    expect(providerStatus('minio').configured).toBe(true);
  });

  it('S3 не настроен без ключей и не раскрывает их в статусе', () => {
    process.env.S3_ENDPOINT = 'https://s3.example.ru';
    delete process.env.S3_ACCESS_KEY;
    const status = providerStatus('s3');
    expect(status.configured).toBe(false);
    expect(JSON.stringify(status)).not.toContain('secret');
  });

  it('оба провайдера описаны в списке', () => {
    expect(Object.keys(PROVIDERS)).toEqual(['minio', 's3']);
  });
});
