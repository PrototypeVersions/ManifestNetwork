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
