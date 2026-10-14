import fs from 'node:fs/promises';
import path from 'node:path';
import { projectExists } from '../store/projects.js';
import { getConfig } from '../../config.js';

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

// Код проекта из названия: кириллица в латиницу, всё лишнее в дефис
export function slugify(name) {
  const latin = [...String(name).toLowerCase()].map((ch) => TRANSLIT[ch] ?? ch).join('');
  return latin.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '') || 'project';
}

const folderExists = (slug) => {
  const { reposDir } = getConfig().worker;
  return reposDir ? fs.access(path.join(reposDir, slug)).then(() => true, () => false) : false;
};

// Свободный код: не занят проектом и нет такой папки на сервере (чужую папку не подхватываем)
export async function uniqueSlug(name) {
  const base = slugify(name);
  for (let n = 1; ; n += 1) {
    const slug = n === 1 ? base : `${base}-${n}`;
    if (!(await projectExists(slug)) && !(await folderExists(slug))) return slug;
  }
}
