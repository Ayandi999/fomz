const fs = require('fs');
const path = require('path');

const rootEnv = path.join(__dirname, '.env');
const rootEnvExample = path.join(__dirname, '.env.example');

// 1. Ensure root .env exists
if (!fs.existsSync(rootEnv)) {
  if (fs.existsSync(rootEnvExample)) {
    console.log('Copying .env.example to .env...');
    fs.copyFileSync(rootEnvExample, rootEnv);
  } else {
    console.log('No .env or .env.example found. Creating empty .env...');
    fs.writeFileSync(rootEnv, '');
  }
}

const rootStat = fs.statSync(rootEnv);

// 2. Find all directories in apps/ and packages/
const dirs = [];
['apps', 'packages'].forEach(parentDir => {
  const parentPath = path.join(__dirname, parentDir);
  if (fs.existsSync(parentPath)) {
    fs.readdirSync(parentPath).forEach(subDir => {
      const subPath = path.join(parentPath, subDir);
      if (fs.statSync(subPath).isDirectory()) {
        dirs.push(subPath);
      }
    });
  }
});

// 3. Link .env to each directory
dirs.forEach(dir => {
  const targetEnv = path.join(dir, '.env');
  let needsLink = true;

  if (fs.existsSync(targetEnv)) {
    const targetStat = fs.statSync(targetEnv);
    // Check if they are already pointing to the same physical file (hard-linked)
    if (rootStat.ino === targetStat.ino && rootStat.dev === targetStat.dev) {
      needsLink = false;
      console.log(`✅ Already linked: ${path.relative(__dirname, targetEnv)}`);
    } else {
      // It exists but is a different file, let's delete it so we can establish the hard link
      console.log(`Removing unlinked .env in ${path.relative(__dirname, targetEnv)}`);
      try {
        fs.unlinkSync(targetEnv);
      } catch (e) {
        console.warn(`Could not unlink ${path.relative(__dirname, targetEnv)}: ${e.message}`);
      }
    }
  }

  if (needsLink) {
    try {
      fs.linkSync(rootEnv, targetEnv);
      console.log(`🔗 Hard-linked: ${path.relative(__dirname, targetEnv)}`);
    } catch (err) {
      // Safe fallback if hard linking is not possible (e.g. crossing drives)
      console.warn(`⚠️ Hard-link failed for ${path.relative(__dirname, targetEnv)}. Falling back to copy.`);
      fs.copyFileSync(rootEnv, targetEnv);
    }
  }
});
