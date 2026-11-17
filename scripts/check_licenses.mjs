// Copyright 2026 Aragornb / MAGI-Hub. Licensed under the Apache License, Version 2.0.
import fs from 'node:fs';
import path from 'node:path';

const PERMISSIVE_TOKENS = ['MIT', 'APACHE', 'BSD', 'ISC', '0BSD', 'UNLICENSE'];
const RESTRICTED_LICENSES = ['GPL', 'AGPL', 'LGPL', 'EUPL', 'SSPL'];
const rootDir = process.cwd();
const pkgPath = path.join(rootDir, 'package.json');
const nodeModulesDir = path.join(rootDir, 'node_modules');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const deps = {
  ...(pkg.dependencies || {}),
  ...(pkg.devDependencies || {}),
};

const violations = [];
const checked = [];

for (const depName of Object.keys(deps)) {
  const depPkgPath = path.join(nodeModulesDir, depName, 'package.json');
  if (!fs.existsSync(depPkgPath)) continue;
  const depPkg = JSON.parse(fs.readFileSync(depPkgPath, 'utf-8'));
  const license = String(depPkg.license || 'UNKNOWN').toUpperCase();
  checked.push({ name: depName, license });

  const hasPermissiveOr = license.includes(' OR ') && PERMISSIVE_TOKENS.some((ok) => license.includes(ok));
  if (!hasPermissiveOr && RESTRICTED_LICENSES.some((bad) => license.includes(bad))) {
    violations.push({ name: depName, license });
  }
}

console.log(`[LICENSE CHECK] Verificados ${checked.length} pacotes diretos.`);
if (violations.length > 0) {
  console.error('[LICENSE CHECK] Licenças copyleft restritivas detectadas:', violations);
  process.exit(1);
}
console.log('[LICENSE CHECK] Nenhuma licença copyleft restritiva detectada. Aprovado para distribuição.');
