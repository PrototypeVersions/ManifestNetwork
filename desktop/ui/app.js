const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

const $ = (id) => document.getElementById(id);
const setupView = $("setupView");
const chatView = $("chatView");
const analyzeBtn = $("analyzeBtn");
const profileCard = $("profileCard");
const recommendCard = $("recommendCard");
const readyCard = $("readyCard");
const installBtn = $("installBtn");
const startBtn = $("startBtn");
const setupStatus = $("setupStatus");
const downloadWrap = $("downloadWrap");
const downloadBar = $("downloadBar");
const downloadText = $("downloadText");
const downloadPercent = $("downloadPercent");
const messagesEl = $("messages");
const emptyState = $("emptyState");
const chatForm = $("chatForm");
const promptInput = $("promptInput");
const sendBtn = $("sendBtn");
const newChatBtn = $("newChatBtn");
const railNewChatBtn = $("railNewChatBtn");
const chatSessionList = $("chatSessionList");
const noChatsLabel = $("noChatsLabel");
const chatTitle = $("chatTitle");
const resetBtn = $("resetBtn");

const networkBtn = $("networkBtn");
const networkHeaderBtn = $("networkHeaderBtn");
const networkOverlay = $("networkOverlay");
const networkCloseBtn = $("networkCloseBtn");
const networkDoneBtn = $("networkDoneBtn");
const networkRailStatus = $("networkRailStatus");
const performanceToggle = $("performanceToggle");
const computeToggle = $("computeToggle");
const learningToggle = $("learningToggle");
const feedbackToggle = $("feedbackToggle");
const computeLimit = $("computeLimit");
const hoursSlider = $("hoursSlider");
const hoursValue = $("hoursValue");
const nodeMode = $("nodeMode");
const nodeModeCopy = $("nodeModeCopy");
const creditEstimate = $("creditEstimate");

const NETWORK_STORAGE_KEY = "manifest-network-preferences-v1";
const CHAT_STORAGE_KEY = "manifest-chat-sessions-v1";
const ACTIVE_CHAT_KEY = "manifest-active-chat-v1";

let sessions = loadChatSessions();
let currentSessionId = localStorage.getItem(ACTIVE_CHAT_KEY) || sessions[0]?.id || null;
let history = currentSession()?.messages.map((message) => ({ ...message })) || [];
let activeAssistant = null;
let generating = false;
let starting = false;

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Preparing download…";
  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

function setStatus(text) { setupStatus.textContent = text; }

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanSessionTitle(text) {
  const singleLine = String(text || "").replace(/\s+/g, " ").trim();
  if (!singleLine) return "New chat";
  return singleLine.length > 44 ? `${singleLine.slice(0, 43)}…` : singleLine;
}

function loadChatSessions() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved
      .filter((session) => session && typeof session.id === "string" && Array.isArray(session.messages))
      .map((session) => ({
        id: session.id,
        title: cleanSessionTitle(session.title || "New chat"),
        updatedAt: Number(session.updatedAt || Date.now()),
        messages: session.messages
          .filter((message) => message && ["user", "assistant"].includes(message.role) && typeof message.content === "string")
          .map((message) => ({ role: message.role, content: message.content }))
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (_) {
    return [];
  }
}

function saveChatSessions() {
  sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
  if (currentSessionId) localStorage.setItem(ACTIVE_CHAT_KEY, currentSessionId);
  else localStorage.removeItem(ACTIVE_CHAT_KEY);
}

function currentSession() {
  return sessions.find((session) => session.id === currentSessionId) || null;
}

function ensureCurrentSession() {
  let session = currentSession();
  if (session) return session;
  session = { id: createId(), title: "New chat", updatedAt: Date.now(), messages: [] };
  sessions.unshift(session);
  currentSessionId = session.id;
  saveChatSessions();
  renderSessionList();
  return session;
}

function persistCurrentSession() {
  const session = ensureCurrentSession();
  session.messages = history.map((message) => ({ role: message.role, content: message.content }));
  const firstUser = session.messages.find((message) => message.role === "user" && message.content.trim());
  session.title = firstUser ? cleanSessionTitle(firstUser.content) : "New chat";
  session.updatedAt = Date.now();
  saveChatSessions();
  renderSessionList();
  updateChatTitle();
}

function updateChatTitle() {
  const session = currentSession();
  if (chatTitle) chatTitle.textContent = session && session.title !== "New chat" ? session.title : "Manifest";
}

function renderSessionList() {
  if (!chatSessionList) return;
  chatSessionList.innerHTML = "";
  const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  noChatsLabel?.classList.toggle("hidden", sorted.length > 0);

  sorted.forEach((session) => {
    const row = document.createElement("div");
    row.className = `chat-session-item${session.id === currentSessionId ? " active" : ""}`;

    const open = document.createElement("button");
    open.type = "button";
    open.className = "chat-session-open";
    open.textContent = session.title || "New chat";
    open.title = session.title || "New chat";
    open.addEventListener("click", () => loadSession(session.id));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "chat-session-delete";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${session.title || "chat"}`);
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteSession(session.id);
    });

    row.append(open, remove);
    chatSessionList.appendChild(row);
  });
}

function clearRenderedMessages() {
  messagesEl.querySelectorAll(".message").forEach((node) => node.remove());
}

function renderConversation() {
  clearRenderedMessages();
  if (!history.length) {
    emptyState?.classList.remove("hidden");
  } else {
    emptyState?.classList.add("hidden");
    history.forEach((message) => addMessage(message.role, message.content));
  }
  updateChatTitle();
}

function loadSession(id) {
  if (generating) return;
  const session = sessions.find((candidate) => candidate.id === id);
  if (!session) return;
  currentSessionId = id;
  history = session.messages.map((message) => ({ ...message }));
  localStorage.setItem(ACTIVE_CHAT_KEY, id);
  renderConversation();
  renderSessionList();
  promptInput?.focus();
}

function createNewChat() {
  if (generating) return;
  const session = { id: createId(), title: "New chat", updatedAt: Date.now(), messages: [] };
  sessions.unshift(session);
  currentSessionId = session.id;
  history = [];
  saveChatSessions();
  renderConversation();
  renderSessionList();
  promptInput?.focus();
}

function deleteSession(id) {
  if (generating) return;
  const session = sessions.find((candidate) => candidate.id === id);
  if (!session) return;
  const okay = window.confirm(`Delete “${session.title || "this chat"}” from this computer?`);
  if (!okay) return;

  sessions = sessions.filter((candidate) => candidate.id !== id);
  if (currentSessionId === id) {
    const next = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)[0] || null;
    currentSessionId = next?.id || null;
    history = next?.messages.map((message) => ({ ...message })) || [];
    renderConversation();
  }
  saveChatSessions();
  renderSessionList();
}

async function analyze() {
  analyzeBtn.disabled = true;
  analyzeBtn.firstChild.textContent = "Analyzing… ";
  setStatus("READING LOCAL HARDWARE / NOTHING SENT TO A SERVER");
  try {
    const p = await invoke("get_device_profile");
    $("profileSystem").textContent = `${p.os} · ${p.arch}`;
    $("profileCpu").textContent = `${p.cpu} · ${p.logicalCores} threads`;
    $("profileRam").textContent = `${p.ramGb.toFixed(1)} GB`;
    $("profileTier").textContent = p.tier;
    $("scorePill").textContent = `MANIFEST SCORE ${p.score}`;
    $("modelReason").textContent = p.reason;
    profileCard.classList.remove("hidden");
    recommendCard.classList.remove("hidden");
    setStatus("DEVICE PROFILE COMPLETE / LOCAL RECOMMENDATION READY");
  } catch (err) {
    setStatus(`ANALYSIS ERROR / ${String(err)}`);
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.firstChild.textContent = "Analyze Again ";
  }
}

async function refreshInstallState() {
  try {
    const state = await invoke("get_install_state");
    if (state.installed) {
      recommendCard.classList.remove("hidden");
      readyCard.classList.remove("hidden");
      installBtn.textContent = "Installed ✓";
      installBtn.disabled = true;
      setStatus("LOCAL AI INSTALLED / NETWORK STILL OPTIONAL");
      return true;
    }
  } catch (_) {}
  return false;
}

async function installModel() {
  installBtn.disabled = true;
  downloadWrap.classList.remove("hidden");
  setStatus("DOWNLOADING YOUR LOCAL AI / ONE-TIME MODEL INSTALL");
  try {
    await invoke("install_recommended_model");
    downloadBar.style.width = "100%";
    downloadPercent.textContent = "100%";
    downloadText.textContent = "Verified and installed";
    installBtn.textContent = "Installed ✓";
    readyCard.classList.remove("hidden");
    setStatus("LOCAL AI INSTALLED / STARTING MANIFEST");
    await startManifest();
  } catch (err) {
    installBtn.disabled = false;
    installBtn.textContent = "Try Install Again ↓";
    setStatus(`INSTALL ERROR / ${String(err)}`);
  }
}

async function startManifest() {
  if (starting || !chatView.classList.contains("hidden")) return;
  starting = true;
  startBtn.disabled = true;
  startBtn.firstChild.textContent = "Starting… ";
  setStatus("STARTING PRIVATE LOCAL RUNTIME");
  try {
    await invoke("start_local_ai");
    setupView.classList.add("hidden");
    chatView.classList.remove("hidden");
    renderConversation();
    renderSessionList();
    promptInput.focus();
  } catch (err) {
    setStatus(`START ERROR / ${String(err)}`);
    startBtn.disabled = false;
    startBtn.firstChild.textContent = "Start Manifest ";
  } finally {
    starting = false;
  }
}

function addMessage(role, content = "") {
  emptyState?.classList.add("hidden");
  const row = document.createElement("div");
  row.className = `message ${role}`;
  const label = document.createElement("div");
  label.className = "role";
  label.textContent = role === "user" ? "YOU" : "MANIFEST";
  const body = document.createElement("div");
  body.className = "content";
  body.textContent = content;
  row.append(label, body);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return body;
}

function autoSize() {
  promptInput.style.height = "auto";
  promptInput.style.height = `${Math.min(promptInput.scrollHeight, 140)}px`;
}

async function sendMessage(text) {
  if (!text.trim() || generating) return;
  ensureCurrentSession();
  const clean = text.trim();
  history.push({ role: "user", content: clean });
  persistCurrentSession();
  addMessage("user", clean);
  activeAssistant = addMessage("assistant", "");
  activeAssistant.classList.add("typing-cursor");
  generating = true;
  sendBtn.disabled = true;
  promptInput.value = "";
  autoSize();
  try {
    await invoke("chat", { messages: history });
  } catch (err) {
    const errorText = `I couldn't complete that locally: ${String(err)}`;
    if (activeAssistant && !activeAssistant.textContent) activeAssistant.textContent = errorText;
    activeAssistant?.classList.remove("typing-cursor");
    history.push({ role: "assistant", content: activeAssistant?.textContent || errorText });
    persistCurrentSession();
    activeAssistant = null;
    generating = false;
    sendBtn.disabled = false;
  }
}

function defaultNetworkPreferences() {
  return { performance: false, compute: false, learning: false, feedback: false, hours: 4 };
}

function loadNetworkPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(NETWORK_STORAGE_KEY) || "null");
    return { ...defaultNetworkPreferences(), ...(saved || {}) };
  } catch (_) {
    return defaultNetworkPreferences();
  }
}

function readNetworkControls() {
  return {
    performance: !!performanceToggle?.checked,
    compute: !!computeToggle?.checked,
    learning: !!learningToggle?.checked,
    feedback: !!feedbackToggle?.checked,
    hours: Math.max(1, Math.min(12, Number(hoursSlider?.value || 4)))
  };
}

function writeNetworkControls(prefs) {
  if (performanceToggle) performanceToggle.checked = !!prefs.performance;
  if (computeToggle) computeToggle.checked = !!prefs.compute;
  if (learningToggle) learningToggle.checked = !!prefs.learning;
  if (feedbackToggle) feedbackToggle.checked = !!prefs.feedback;
  if (hoursSlider) hoursSlider.value = String(prefs.hours || 4);
  updateNetworkPreview();
}

function estimateCredits(prefs) {
  let total = 0;
  if (prefs.performance) total += 240;
  if (prefs.compute) total += prefs.hours * 155;
  if (prefs.learning) total += 520;
  if (prefs.feedback) total += 180;
  return total;
}

function updateNetworkPreview() {
  const prefs = readNetworkControls();
  const enabled = [prefs.performance, prefs.compute, prefs.learning, prefs.feedback].filter(Boolean).length;
  const credits = estimateCredits(prefs);

  if (hoursValue) hoursValue.textContent = String(prefs.hours);
  computeLimit?.classList.toggle("disabled", !prefs.compute);
  if (creditEstimate) creditEstimate.textContent = `${credits.toLocaleString()} / month`;

  if (enabled === 0) {
    if (nodeMode) nodeMode.textContent = "PRIVATE";
    if (nodeModeCopy) nodeModeCopy.textContent = "Nothing is selected for contribution.";
  } else if (prefs.compute && (prefs.performance || prefs.learning || prefs.feedback)) {
    if (nodeMode) nodeMode.textContent = "NETWORK";
    if (nodeModeCopy) nodeModeCopy.textContent = `${enabled} contribution modes selected. Preferences remain local in this alpha.`;
  } else {
    if (nodeMode) nodeMode.textContent = "SELECTIVE";
    if (nodeModeCopy) nodeModeCopy.textContent = `${enabled} contribution mode${enabled === 1 ? "" : "s"} selected.`;
  }
}

function updateNetworkBadges() {
  const prefs = loadNetworkPreferences();
  const enabled = [prefs.performance, prefs.compute, prefs.learning, prefs.feedback].filter(Boolean).length;
  const label = enabled ? `${enabled} mode${enabled === 1 ? "" : "s"} selected` : "Private mode";
  if (networkRailStatus) networkRailStatus.textContent = label;
  networkBtn?.classList.toggle("active", enabled > 0);
  networkHeaderBtn?.classList.toggle("active", enabled > 0);
  if (networkHeaderBtn) networkHeaderBtn.textContent = enabled ? `Network · ${enabled}` : "Network";
}

function openNetworkSettings() {
  writeNetworkControls(loadNetworkPreferences());
  networkOverlay?.classList.remove("hidden");
  networkOverlay?.setAttribute("aria-hidden", "false");
}

function closeNetworkSettings(save = false) {
  if (save) {
    localStorage.setItem(NETWORK_STORAGE_KEY, JSON.stringify(readNetworkControls()));
    updateNetworkBadges();
  }
  networkOverlay?.classList.add("hidden");
  networkOverlay?.setAttribute("aria-hidden", "true");
}

async function resetManifestNetwork() {
  const okay = window.confirm(
    "Reset Manifest on this computer?\n\nThis will remove the installed local AI model, saved chats, and Network settings. The app itself will remain installed."
  );
  if (!okay) return;

  resetBtn.disabled = true;
  resetBtn.querySelector("strong").textContent = "Resetting…";
  try {
    await invoke("reset_manifest_state");
    localStorage.removeItem(NETWORK_STORAGE_KEY);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_CHAT_KEY);
    window.location.reload();
  } catch (err) {
    window.alert(`Manifest could not finish the reset: ${String(err)}`);
    resetBtn.disabled = false;
    resetBtn.querySelector("strong").textContent = "Reset Manifest";
  }
}

analyzeBtn.addEventListener("click", analyze);
installBtn.addEventListener("click", installModel);
startBtn.addEventListener("click", startManifest);
promptInput.addEventListener("input", autoSize);
promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});
chatForm.addEventListener("submit", (e) => { e.preventDefault(); sendMessage(promptInput.value); });
newChatBtn.addEventListener("click", createNewChat);
railNewChatBtn?.addEventListener("click", createNewChat);
resetBtn?.addEventListener("click", resetManifestNetwork);

networkBtn?.addEventListener("click", openNetworkSettings);
networkHeaderBtn?.addEventListener("click", openNetworkSettings);
networkCloseBtn?.addEventListener("click", () => closeNetworkSettings(false));
networkDoneBtn?.addEventListener("click", () => closeNetworkSettings(true));
networkOverlay?.addEventListener("click", (event) => {
  if (event.target === networkOverlay) closeNetworkSettings(false);
});
[performanceToggle, computeToggle, learningToggle, feedbackToggle, hoursSlider]
  .filter(Boolean)
  .forEach((control) => control.addEventListener("input", updateNetworkPreview));

listen("model-download-progress", ({ payload }) => {
  const pct = Math.max(0, Math.min(100, payload.percent || 0));
  downloadBar.style.width = `${pct}%`;
  downloadPercent.textContent = `${Math.round(pct)}%`;
  downloadText.textContent = `${formatBytes(payload.downloaded)} of ${formatBytes(payload.total)}`;
});

listen("chat-token", ({ payload }) => {
  if (!activeAssistant) return;
  activeAssistant.textContent += payload.content || "";
  messagesEl.scrollTop = messagesEl.scrollHeight;
});

listen("chat-done", () => {
  if (!activeAssistant) return;
  activeAssistant.classList.remove("typing-cursor");
  const answer = activeAssistant.textContent;
  if (answer) history.push({ role: "assistant", content: answer });
  persistCurrentSession();
  activeAssistant = null;
  generating = false;
  sendBtn.disabled = false;
  promptInput.focus();
});

updateNetworkBadges();
renderSessionList();
renderConversation();

(async function boot() {
  const installed = await refreshInstallState();
  if (installed) {
    try {
      const p = await invoke("get_device_profile");
      $("profileSystem").textContent = `${p.os} · ${p.arch}`;
      $("profileCpu").textContent = `${p.cpu} · ${p.logicalCores} threads`;
      $("profileRam").textContent = `${p.ramGb.toFixed(1)} GB`;
      $("profileTier").textContent = p.tier;
      $("scorePill").textContent = `MANIFEST SCORE ${p.score}`;
      profileCard.classList.remove("hidden");
    } catch (_) {}
    setStatus("LOCAL AI INSTALLED / STARTING MANIFEST");
    await startManifest();
  }
})();