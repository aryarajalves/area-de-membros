import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function buildCapacitorConfig(profile) {
  if (!profile?.appId || !profile?.appName) {
    throw new Error('app.config.json deve conter "appId" e "appName" obrigatórios.');
  }
  return {
    appId: profile.appId,
    appName: profile.appName,
    webDir: 'dist',
    server: {
      androidScheme: profile.androidScheme || 'https',
    },
    plugins: {
      PushNotifications: {
        presentationOptions: ['badge', 'sound', 'alert'],
      },
    },
  };
}

export function applyWhitelabelProfile(slug, frontendRoot) {
  if (!slug || !slug.trim()) {
    throw new Error('Informe o slug do perfil. Exemplo: npm run cap:prepare -- exemplo-expert');
  }

  const cleanSlug = slug.trim();
  const profileDir = path.join(frontendRoot, 'apps-config', cleanSlug);
  const configPath = path.join(profileDir, 'app.config.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(`Perfil "${cleanSlug}" não encontrado em ${configPath}`);
  }

  const profile = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const capacitorConfig = buildCapacitorConfig(profile);

  fs.writeFileSync(
    path.join(frontendRoot, 'capacitor.config.json'),
    `${JSON.stringify(capacitorConfig, null, 2)}\n`,
    'utf-8',
  );

  const apiBaseUrl = (profile.apiBaseUrl || '').trim();
  fs.writeFileSync(
    path.join(frontendRoot, '.env.production.local'),
    `VITE_API_BASE_URL=${apiBaseUrl}\n`,
    'utf-8',
  );

  const googleServicesSrc = path.join(profileDir, 'google-services.json');
  const androidAppDir = path.join(frontendRoot, 'android', 'app');
  let copiedGoogleServices = false;

  if (fs.existsSync(googleServicesSrc) && fs.existsSync(androidAppDir)) {
    fs.copyFileSync(googleServicesSrc, path.join(androidAppDir, 'google-services.json'));
    copiedGoogleServices = true;
  }

  const stringsXmlPath = path.join(androidAppDir, 'src', 'main', 'res', 'values', 'strings.xml');
  if (fs.existsSync(stringsXmlPath)) {
    let xml = fs.readFileSync(stringsXmlPath, 'utf-8');
    const safeName = profile.appName.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    xml = xml.replace(/<string name="app_name">.*?<\/string>/, `<string name="app_name">${safeName}</string>`);
    xml = xml.replace(/<string name="title_activity_main">.*?<\/string>/, `<string name="title_activity_main">${safeName}</string>`);
    fs.writeFileSync(stringsXmlPath, xml, 'utf-8');
  }

  return {
    slug: cleanSlug,
    appId: capacitorConfig.appId,
    appName: capacitorConfig.appName,
    apiBaseUrl,
    copiedGoogleServices,
  };
}

const isCliRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCliRun) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const frontendRoot = path.resolve(__dirname, '..');
  const slug = process.argv[2];
  try {
    const result = applyWhitelabelProfile(slug, frontendRoot);
    console.log(`[CAP-PREPARE] Perfil "${result.slug}" aplicado: ${result.appName} (${result.appId})`);
    console.log(`[CAP-PREPARE] VITE_API_BASE_URL=${result.apiBaseUrl}`);
    if (!result.copiedGoogleServices) {
      console.warn('[CAP-PREPARE] Aviso: google-services.json não encontrado no perfil (adicione antes do build .aab).');
    }
  } catch (err) {
    console.error(`[CAP-PREPARE] Erro: ${err.message}`);
    process.exit(1);
  }
}
