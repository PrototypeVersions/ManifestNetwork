(() => {
  const originalResetBtn = document.getElementById("resetBtn");
  if (!originalResetBtn || !window.__TAURI__?.core?.invoke) return;

  // Replace the original button node so the older native-confirm click handler
  // is removed. Native browser confirm dialogs are not reliable in every
  // packaged WebView, so reset uses an in-app confirmation panel instead.
  const resetBtn = originalResetBtn.cloneNode(true);
  originalResetBtn.replaceWith(resetBtn);
  const { invoke } = window.__TAURI__.core;

  const style = document.createElement("style");
  style.textContent = `
    .reset-confirm-overlay{position:fixed;inset:0;z-index:220;background:rgba(17,19,18,.64);backdrop-filter:blur(6px);display:none;place-items:center;padding:24px}
    .reset-confirm-overlay.open{display:grid}
    .reset-confirm-panel{width:min(520px,100%);background:#f3f0e9;border:1px solid rgba(0,0,0,.16);border-radius:16px;box-shadow:0 34px 100px rgba(0,0,0,.3);padding:28px}
    .reset-confirm-panel .reset-kicker{font-size:8px;letter-spacing:.16em;color:#7f3f3f;font-weight:700}
    .reset-confirm-panel h2{font-size:32px;line-height:1.02;letter-spacing:-.045em;font-weight:470;margin:11px 0 12px}
    .reset-confirm-panel p{font-size:11px;line-height:1.6;color:#6d716d;margin:0}
    .reset-confirm-list{margin:19px 0 0;padding:17px 0;border-top:1px solid #cbc8c0;border-bottom:1px solid #cbc8c0;display:grid;gap:9px}
    .reset-confirm-list span{font-size:10px;color:#555a56}
    .reset-confirm-error{display:none;margin-top:14px;padding:11px 12px;border-radius:9px;background:#eee1de;color:#7b3939;font-size:9px;line-height:1.45}
    .reset-confirm-error.show{display:block}
    .reset-confirm-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:20px}
    .reset-confirm-actions button{border:1px solid #aaa9a3;border-radius:999px;padding:11px 16px;font-size:10px;font-weight:650;cursor:pointer}
    .reset-cancel{background:#f8f6f0;color:#171918}
    .reset-confirm{background:#171918!important;color:#fff!important;border-color:#171918!important}
    .reset-confirm:disabled,.reset-cancel:disabled{opacity:.45;cursor:default}
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.className = "reset-confirm-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <section class="reset-confirm-panel" role="dialog" aria-modal="true" aria-labelledby="resetConfirmTitle">
      <div class="reset-kicker">RESET THIS INSTALLATION</div>
      <h2 id="resetConfirmTitle">Start Manifest fresh?</h2>
      <p>This removes Manifest's local setup data from this computer. The Manifest application itself stays installed.</p>
      <div class="reset-confirm-list">
        <span>• Remove the downloaded local AI model</span>
        <span>• Delete saved chat sessions</span>
        <span>• Clear Network participation settings</span>
      </div>
      <div id="resetConfirmError" class="reset-confirm-error"></div>
      <div class="reset-confirm-actions">
        <button id="resetCancelBtn" class="reset-cancel" type="button">Cancel</button>
        <button id="resetConfirmBtn" class="reset-confirm" type="button">Reset Manifest</button>
      </div>
    </section>
  `;
  document.body.appendChild(overlay);

  const cancelBtn = overlay.querySelector("#resetCancelBtn");
  const confirmBtn = overlay.querySelector("#resetConfirmBtn");
  const errorBox = overlay.querySelector("#resetConfirmError");

  function openResetPanel() {
    errorBox.classList.remove("show");
    errorBox.textContent = "";
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    confirmBtn.focus();
  }

  function closeResetPanel() {
    if (confirmBtn.disabled) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    resetBtn.focus();
  }

  resetBtn.addEventListener("click", openResetPanel);
  cancelBtn.addEventListener("click", closeResetPanel);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeResetPanel();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("open")) closeResetPanel();
  });

  confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    confirmBtn.textContent = "Resetting…";
    errorBox.classList.remove("show");
    errorBox.textContent = "";

    try {
      await invoke("reset_manifest_state");
      localStorage.removeItem("manifest-network-preferences-v1");
      localStorage.removeItem("manifest-chat-sessions-v1");
      localStorage.removeItem("manifest-active-chat-v1");
      window.location.reload();
    } catch (err) {
      errorBox.textContent = `Manifest could not finish the reset: ${String(err)}`;
      errorBox.classList.add("show");
      confirmBtn.disabled = false;
      cancelBtn.disabled = false;
      confirmBtn.textContent = "Reset Manifest";
    }
  });
})();
