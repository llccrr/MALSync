import semverGte from 'semver/functions/gte';
import semverGt from 'semver/functions/gt';

export function getCurrentVersion(): string {
  return normalizeVersion(api.storage.version());
}

// Chromium allows a fourth numeric component for personal build revisions.
export function normalizeVersion(version: string): string {
  return version.replace(/^(\d+\.\d+\.\d+)\.\d+$/, '$1');
}

export function greaterOrEqualCurrentVersion(version: string): boolean {
  return semverGte(version, getCurrentVersion());
}

export function greaterCurrentVersion(version: string): boolean {
  return semverGt(version, getCurrentVersion()) && version !== getCurrentVersion();
}
