const performanceToggle = document.getElementById('performanceToggle');
const computeToggle = document.getElementById('computeToggle');
const learningToggle = document.getElementById('learningToggle');
const feedbackToggle = document.getElementById('feedbackToggle');
const hoursSlider = document.getElementById('hoursSlider');
const hoursValue = document.getElementById('hoursValue');
const computeLimit = document.getElementById('computeLimit');

const creditEstimate = document.getElementById('creditEstimate');
const performanceCredit = document.getElementById('performanceCredit');
const computeCredit = document.getElementById('computeCredit');
const learningCredit = document.getElementById('learningCredit');
const feedbackCredit = document.getElementById('feedbackCredit');

function calculatePreview() {
  const performance = performanceToggle?.checked ? 240 : 0;
  const hours = Number(hoursSlider?.value || 4);
  const compute = computeToggle?.checked ? hours * 155 : 0;
  const learning = learningToggle?.checked ? 520 : 0;
  const feedback = feedbackToggle?.checked ? 180 : 0;
  const total = performance + compute + learning + feedback;

  if (hoursValue) hoursValue.textContent = String(hours);
  if (computeLimit) computeLimit.classList.toggle('active', !!computeToggle?.checked);
  if (performanceCredit) performanceCredit.textContent = performance.toLocaleString();
  if (computeCredit) computeCredit.textContent = compute.toLocaleString();
  if (learningCredit) learningCredit.textContent = learning.toLocaleString();
  if (feedbackCredit) feedbackCredit.textContent = feedback.toLocaleString();
  if (creditEstimate) creditEstimate.textContent = total.toLocaleString();
}

[performanceToggle, computeToggle, learningToggle, feedbackToggle, hoursSlider]
  .filter(Boolean)
  .forEach(control => control.addEventListener('input', calculatePreview));

calculatePreview();

function installBrowserDemoSection() {
  if (!document.querySelector('link[href="browser-demo-embed.css"]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'browser-demo-embed.css';
    document.head.appendChild(css);
  }

  const heroPrimary = document.querySelector('.hero .hero-actions .primary-btn');
  if (heroPrimary) {
    heroPrimary.href = '#demo';
    heroPrimary.innerHTML = 'Try Browser Demo <span>↓</span>';
  }

  const nav = document.querySelector('.nav-links');
  if (nav && !nav.querySelector('a[href="#demo"]')) {
    const demoLink = document.createElement('a');
    demoLink.href = '#demo';
    demoLink.textContent = 'Browser Demo';
    nav.prepend(demoLink);
  }

  if (document.getElementById('demo')) return;
  const finalCta = document.querySelector('.final-cta');
  if (!finalCta) return;

  const section = document.createElement('section');
  section.className = 'browser-demo-section';
  section.id = 'demo';
  section.innerHTML = `
    <div class="browser-demo-intro">
      <div class="eyebrow">LIVE BROWSER DEMO</div>
      <h2>Try the Manifest experience<br>without installing anything.</h2>
      <p>Analyze this device, install a lightweight browser-local AI, save multiple chat sessions in the left sidebar, and preview the same independent Network Settings concept used by the desktop app. The chat interface below is intentionally black and runs locally in your browser when WebGPU is available.</p>
    </div>
    <div class="browser-demo-frame-wrap">
      <iframe class="browser-demo-frame" src="browser-demo/" title="Manifest live browser demo" loading="lazy" allow="webgpu; clipboard-read; clipboard-write"></iframe>
    </div>
    <div class="browser-demo-note"><strong>Browser demo:</strong><span>Two lightweight WebLLM models only. The downloadable desktop app is the broader Manifest experience.</span></div>
  `;
  finalCta.parentNode.insertBefore(section, finalCta);
}

installBrowserDemoSection();