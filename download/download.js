const cards = {
  apple: document.getElementById('appleCard'),
  intel: document.getElementById('intelCard'),
  windows: document.getElementById('windowsCard')
};
const primary = document.getElementById('primaryDownload');
const recommendation = document.getElementById('recommendationText');

const RELEASE_TAG = 'v0.2.3';
const RELEASE_API = `https://api.github.com/repos/PrototypeVersions/ManifestNetwork/releases/tags/${RELEASE_TAG}`;

function recommend(type, label, href, detail) {
  Object.values(cards).forEach(card => card?.classList.remove('recommended'));
  cards[type]?.classList.add('recommended');
  if (primary) {
    primary.href = href;
    primary.innerHTML = `${label} <span>↓</span>`;
  }
  if (recommendation) recommendation.textContent = detail;
}

const links = {
  apple: 'https://github.com/PrototypeVersions/ManifestNetwork/releases/download/v0.2.3/Manifest-Network-0.2.3-Apple-Silicon.dmg',
  intel: 'https://github.com/PrototypeVersions/ManifestNetwork/releases/download/v0.2.3/Manifest-Network-0.2.3-Intel.dmg',
  windows: 'https://github.com/PrototypeVersions/ManifestNetwork/releases/download/v0.2.3/Manifest-Network-0.2.3-Windows-x64.exe'
};

async function detectPlatform() {
  const ua = navigator.userAgent || '';
  const platform = navigator.userAgentData?.platform || navigator.platform || '';

  if (/Windows/i.test(ua) || /Windows/i.test(platform)) {
    recommend('windows', 'Download for Windows', links.windows, 'This browser appears to be running on Windows, so the x64 installer is highlighted below.');
    return;
  }

  if (/Mac/i.test(ua) || /Mac/i.test(platform)) {
    let arch = '';
    try {
      if (navigator.userAgentData?.getHighEntropyValues) {
        const values = await navigator.userAgentData.getHighEntropyValues(['architecture', 'bitness']);
        arch = String(values.architecture || '').toLowerCase();
      }
    } catch (_) {}

    if (/x86|amd64/.test(arch)) {
      recommend('intel', 'Download for Intel Mac', links.intel, 'This browser reports an Intel Mac, so the Intel build is highlighted below.');
    } else {
      recommend('apple', 'Download for Apple Silicon', links.apple, 'For modern Macs with an M1, M2, M3, M4 or later chip, use the Apple Silicon build highlighted below.');
    }
    return;
  }

  if (primary) primary.href = '#downloads';
  if (recommendation) recommendation.textContent = 'Choose the platform that matches the computer where you want to run Manifest.';
}

function releaseDownloadLinks() {
  return [...document.querySelectorAll(`a[href*="/releases/download/${RELEASE_TAG}/"]`)];
}

function assetNameFromLink(link) {
  try {
    return decodeURIComponent(new URL(link.dataset.liveHref || link.href).pathname.split('/').pop() || '');
  } catch (_) {
    return '';
  }
}

function markPending(link) {
  if (!link.dataset.liveHref) link.dataset.liveHref = link.href;
  if (!link.dataset.liveHtml) link.dataset.liveHtml = link.innerHTML;
  link.href = '#downloads';
  link.setAttribute('aria-disabled', 'true');
  link.style.opacity = '0.55';
  link.style.cursor = 'default';
  link.addEventListener('click', preventPendingNavigation);
}

function markReady(link) {
  if (link.dataset.liveHref) link.href = link.dataset.liveHref;
  if (link.dataset.liveHtml) link.innerHTML = link.dataset.liveHtml;
  link.removeAttribute('aria-disabled');
  link.style.opacity = '';
  link.style.cursor = '';
  link.removeEventListener('click', preventPendingNavigation);
}

function preventPendingNavigation(event) {
  event.preventDefault();
}

async function refreshReleaseAvailability() {
  const downloadLinks = releaseDownloadLinks();

  try {
    const response = await fetch(RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    });

    if (!response.ok) throw new Error(`Release not published yet (${response.status})`);
    const release = await response.json();
    const assets = new Set((release.assets || []).map(asset => asset.name));
    let pending = 0;

    downloadLinks.forEach(link => {
      const assetName = assetNameFromLink(link);
      if (assetName && assets.has(assetName)) {
        markReady(link);
      } else {
        markPending(link);
        pending += 1;
      }
    });

    if (pending > 0) {
      if (recommendation) recommendation.textContent = 'The 0.2.3 installers are still being published. Download buttons will activate automatically as each installer becomes available.';
      window.setTimeout(refreshReleaseAvailability, 30000);
    }
  } catch (_) {
    downloadLinks.forEach(markPending);
    if (recommendation) recommendation.textContent = 'The 0.2.3 installers are finishing publication now. Download buttons will activate automatically when the release is ready.';
    window.setTimeout(refreshReleaseAvailability, 30000);
  }
}

(async function initDownloads() {
  await detectPlatform();
  await refreshReleaseAvailability();
})();
