import { expect } from 'chai';
import { gt, gte } from 'semver';
import { getCurrentVersion, normalizeVersion } from '../../../src/utils/version';

describe('Personal extension versions', () => {
  let originalApi;

  beforeEach(() => {
    originalApi = globalThis.api;
    globalThis.api = { storage: { version: () => '0.12.4.3' } } as any;
  });

  afterEach(() => {
    globalThis.api = originalApi;
  });

  it('loads integrations requiring the upstream version of a personal build', () => {
    const version = getCurrentVersion();
    expect(gt('0.12.4', version)).to.equal(false);
    expect(gte('0.12.4', version)).to.equal(true);
    expect(gt('0.12.5', version)).to.equal(true);
    expect(gt('0.12.3', version)).to.equal(false);
  });

  it('accepts the previous Chromium version when running upgrade migrations', () => {
    expect(normalizeVersion('0.12.4.3')).to.equal('0.12.4');
  });

  it('preserves normal releases and semantic prerelease versions', () => {
    expect(normalizeVersion('0.12.4')).to.equal('0.12.4');
    expect(normalizeVersion('0.12.4-beta.3')).to.equal('0.12.4-beta.3');
  });
});
