import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { applyWhitelabelProfile, buildCapacitorConfig } from './prepare-whitelabel-app.mjs';

describe('prepare-whitelabel-app script', () => {
  it('gera capacitor.config.json válido a partir do perfil', () => {
    const cfg = buildCapacitorConfig({
      appId: 'com.astrologo.app',
      appName: 'Comunidade Astro',
    });
    expect(cfg.appId).toBe('com.astrologo.app');
    expect(cfg.appName).toBe('Comunidade Astro');
    expect(cfg.plugins.PushNotifications.presentationOptions).toContain('alert');
  });

  it('aplica perfil white-label, cria .env.production.local e copia google-services.json', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-cap-'));
    const profileDir = path.join(tmpRoot, 'apps-config', 'astrologo');
    const valuesDir = path.join(tmpRoot, 'android', 'app', 'src', 'main', 'res', 'values');
    fs.mkdirSync(profileDir, { recursive: true });
    fs.mkdirSync(valuesDir, { recursive: true });

    fs.writeFileSync(
      path.join(profileDir, 'app.config.json'),
      JSON.stringify({
        appId: 'com.astrologo.app',
        appName: 'Astro & Cia',
        apiBaseUrl: 'https://back.astro.com.br',
      }),
    );
    fs.writeFileSync(path.join(profileDir, 'google-services.json'), '{"project_info":{}}');
    fs.writeFileSync(
      path.join(valuesDir, 'strings.xml'),
      '<resources><string name="app_name">Old</string><string name="title_activity_main">Old</string></resources>',
    );

    const res = applyWhitelabelProfile('astrologo', tmpRoot);
    expect(res.copiedGoogleServices).toBe(true);

    const capJson = JSON.parse(fs.readFileSync(path.join(tmpRoot, 'capacitor.config.json'), 'utf-8'));
    expect(capJson.appId).toBe('com.astrologo.app');

    const envLocal = fs.readFileSync(path.join(tmpRoot, '.env.production.local'), 'utf-8');
    expect(envLocal).toContain('VITE_API_BASE_URL=https://back.astro.com.br');

    const stringsXml = fs.readFileSync(path.join(valuesDir, 'strings.xml'), 'utf-8');
    expect(stringsXml).toContain('<string name="app_name">Astro &amp; Cia</string>');
    expect(fs.existsSync(path.join(tmpRoot, 'android', 'app', 'google-services.json'))).toBe(true);

    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('lança erro claro quando o perfil não existe', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wl-missing-'));
    expect(() => applyWhitelabelProfile('inexistente', tmpRoot)).toThrow(/não encontrado/i);
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });
});
