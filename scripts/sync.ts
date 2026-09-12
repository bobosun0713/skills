import fs from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import process from 'node:process';

import { VENDOR_MODULES } from '../constants/moduleMap.ts';

async function copyDir(sourceDir: string, targetDir: string, label: string) {
  let copiedCount = 0;
  let skippedCount = 0;

  await fs.cp(sourceDir, targetDir, {
    recursive: true,
    force: true,
    filter: async (src: string, dest: string) => {
      const srcStat = await fs.stat(src);
      if (srcStat.isDirectory())
        return true;

      const destStat = await fs.stat(dest).catch(() => null);
      if (!destStat) {
        console.log(`   [Add] ${basename(src)}`);
        copiedCount++;
        return true;
      }

      if (srcStat.size !== destStat.size) {
        console.log(`   [Update] ${basename(src)} (Size changed)`);
        copiedCount++;
        return true;
      }

      const [srcContent, destContent] = await Promise.all([
        fs.readFile(src),
        fs.readFile(dest),
      ]);

      if (!srcContent.equals(destContent)) {
        console.log(`   [Update] ${basename(src)} (Content changed)`);
        copiedCount++;
        return true;
      }

      skippedCount++;
      return false;
    },
  });

  console.log(
    `✅ [${label}] Processing complete! Add/Update: ${copiedCount} files, Skipped: ${skippedCount} identical files.\n\n`,
  );
}

async function syncModules() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('🟢 No parameters received, no need to copy.');
    return;
  }

  const rootDir = resolve(import.meta.dirname, '..');
  const skillsDir = join(rootDir, 'skills');

  for (const modulePath of args) {
    const moduleName = basename(modulePath);
    const skillModule = VENDOR_MODULES[moduleName];

    if (!skillModule) {
      console.log(`⚠️  [${moduleName}] not found in moduleMap, skipping.`);
      continue;
    }

    const vendorSkillsDir = join(rootDir, 'vendor', moduleName, skillModule.path);

    console.log(`\n📦 Preparing to sync [${moduleName}] -> skills/\n`);

    for (const skillName of new Set(skillModule.skills)) {
      const sourceDir = join(vendorSkillsDir, skillName);
      const targetDir = join(skillsDir, skillName);

      const sourceExists = await fs.stat(sourceDir).catch(() => null);
      if (!sourceExists) {
        console.log(`   ⚠️  Source does not exist, skipping: ${sourceDir}`);
        continue;
      }

      console.log(`⏳ Analyzing and syncing [${skillName}]...`);
      await copyDir(sourceDir, targetDir, skillName);
    }
  }
}

syncModules();
