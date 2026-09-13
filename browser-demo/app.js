import { RuntimeManager } from "../runtimes.js";

const LIGHT_MODEL = "Qwen2-0.5B-Instruct-q4f16_1-MLC";
const STRONG_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
const CHAT_KEY = "manifest-browser-demo-chats-v2";
const ACTIVE_KEY = "manifest-browser-demo-active-v2";
const NETWORK_KEY = "manifest-browser-demo-network-v1";
const SYSTEM_PROMPT = `You are Manifest, a thoughtful and capable AI assistant running locally in the user's browser. Be clear, useful, concise when possible, and candid about uncertainty. Do not claim access to the internet, private files, accounts, or tools unless the user has actually provided the relevant information in the conversation.`;

const $ = id => document.getElementById(id);
const runtime = new RuntimeManager().get("webllm");

const els = {
  setupView: $("setupView"), chatView: $("chatView"), analyzeBtn: $("analyzeBtn"), profileCard: $("profileCard"), recommendCard: $("recommendCard"), readyCard: $("readyCard"), installBtn: $("installBtn"), startBtn: $("startBtn"), setupAgainBtn: $("setupAgainBtn"), setupStatus: $("setupStatus"),
  profilePlatform: $("profilePlatform"), profileCores: $("profileCores"), profileRam: $("profileRam"), profileGpu: $("profileGpu"), scorePill: $("scorePill"), modelName: $("modelName"), modelReason: $("modelReason"), modelTier: $("modelTier"), modelSize: $("modelSize"), downloadWrap: $("downloadWrap"), downloadText: $("downloadText"), downloadPercent: $("downloadPercent"), downloadBar: $("downloadBar"),
  messages: $("messages"), emptyState: $("emptyState"), chatForm: $("chatForm"), promptInput: $("promptInput"), sendBtn: $("sendBtn"), newChatBtn: $("newChatBtn"), sessionList: $("chatSessionList"), noChatsLabel: $("noChatsLabel"), chatTitle: $("chatTitle"),
  networkBtn: $("networkBtn"), networkHeaderBtn: $("networkHeaderBtn"), networkOverlay: $("networkOverlay"), networkCloseBtn: $("networkCloseBtn"), networkDoneBtn: $("networkDoneBtn"), networkRailStatus: $("networkRailStatus"), performanceToggle: $("performanceToggle"), computeToggle: $("computeToggle"), learningToggle: $("learningToggle"), feedbackToggle: $("feedbackToggle"), computeLimit: $("computeLimit"), hoursSlider: $("hoursSlider"), hoursValue: $("hoursValue"), nodeMode: $("nodeMode"), nodeModeCopy: $("nodeModeCopy"), creditEstimate: $("creditEstimate")
};

let recommendedModel = LIGHT_MODEL;
let recommendedName = "Qwen2 0.5B";
let modelReady = false;
let loading = false;
let generating = false;
let activeController = null;
let activeAssistantBody = null;
let sessions = loadSessions();
let activeSessionId = localStorage.getItem(ACTIVE_KEY) || sessions[0]?.id || null;
let history = currentSession()?.messages.map(m => ({ ...m })) || [];

function setStatus(text){ els.setupStatus.textContent = text; }
function createId(){ return crypto.randomUUID?.() || `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function cleanTitle(text){ const s=String(text||"").replace(/\s+/g," ").trim(); return !s?"New chat":s.length>44?`${s.slice(0,43)}…`:s; }
function loadSessions(){ try{ const v=JSON.parse(localStorage.getItem(CHAT_KEY)||"[]"); return Array.isArray(v)?v.filter(s=>s&&s.id&&Array.isArray(s.messages)).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)):[]; }catch{return [];} }
function saveSessions(){ sessions.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)); localStorage.setItem(CHAT_KEY,JSON.stringify(sessions)); if(activeSessionId)localStorage.setItem(ACTIVE_KEY,activeSessionId); else localStorage.removeItem(ACTIVE_KEY); }
function currentSession(){ return sessions.find(s=>s.id===activeSessionId)||null; }
function ensureSession(){ let s=currentSession(); if(s)return s; s={id:createId(),title:"New chat",updatedAt:Date.now(),messages:[]}; sessions.unshift(s); activeSessionId=s.id; saveSessions(); renderSessionList(); return s; }
function persistHistory(){ const s=ensureSession(); s.messages=history.map(m=>({role:m.role,content:m.content})); const first=s.messages.find(m=>m.role==="user"&&m.content.trim()); s.title=first?cleanTitle(first.content):"New chat"; s.updatedAt=Date.now(); saveSessions(); renderSessionList(); updateChatTitle(); }
function updateChatTitle(){ const s=currentSession(); els.chatTitle.textContent=s&&s.title!=="New chat"?s.title:"Manifest"; }

function renderSessionList(){
  els.sessionList.innerHTML="";
  const list=[...sessions].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  els.noChatsLabel.classList.toggle("hidden",list.length>0);
  list.forEach(s=>{
    const row=document.createElement("div"); row.className=`chat-session-item${s.id===activeSessionId?" active":""}`;
    const open=document.createElement("button"); open.type="button"; open.className="chat-session-open"; open.textContent=s.title||"New chat"; open.title=open.textContent; open.addEventListener("click",()=>loadSession(s.id));
    const del=document.createElement("button"); del.type="button"; del.className="chat-session-delete"; del.textContent="×"; del.setAttribute("aria-label",`Delete ${s.title||"chat"}`); del.addEventListener("click",e=>{e.stopPropagation();deleteSession(s.id);});
    row.append(open,del); els.sessionList.appendChild(row);
  });
}
function loadSession(id){ if(generating)return; const s=sessions.find(x=>x.id===id); if(!s)return; activeSessionId=id; history=s.messages.map(m=>({...m})); saveSessions(); renderConversation(); renderSessionList(); showChat(); }
function createNewChat(){ if(generating)return; const s={id:createId(),title:"New chat",updatedAt:Date.now(),messages:[]}; sessions.unshift(s); activeSessionId=s.id; history=[]; saveSessions(); renderConversation(); renderSessionList(); showChat(); els.promptInput.focus(); }
function deleteSession(id){ if(generating)return; sessions=sessions.filter(s=>s.id!==id); if(activeSessionId===id){ const next=sessions[0]||null; activeSessionId=next?.id||null; history=next?.messages.map(m=>({...m}))||[]; } saveSessions(); renderConversation(); renderSessionList(); }

function escapeHTML(value=""){ return value.replace(/[&<>'\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'\"':"&quot;"}[c])); }
function simpleMarkdown(text=""){ let safe=escapeHTML(text); return safe.replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").split(/\n{2,}/).map(b=>`<p>${b.replace(/\n/g,"<br>")}</p>`).join(""); }
function addMessage(role,content=""){
  els.emptyState.classList.add("hidden");
  const row=document.createElement("div"); row.className=`message ${role}`;
  if(role==="assistant"){ const avatar=document.createElement("div"); avatar.className="message-avatar"; avatar.textContent="M"; row.appendChild(avatar); }
  const body=document.createElement("div"); body.className="message-body"; body.innerHTML=simpleMarkdown(content); row.appendChild(body); els.messages.appendChild(row); els.messages.scrollTop=els.messages.scrollHeight; return body;
}
function renderConversation(){ els.messages.querySelectorAll(".message").forEach(n=>n.remove()); if(!history.length)els.emptyState.classList.remove("hidden"); else{ els.emptyState.classList.add("hidden"); history.forEach(m=>addMessage(m.role,m.content)); } updateChatTitle(); }
function showChat(){ if(!modelReady)return; els.setupView.classList.add("hidden"); els.chatView.classList.remove("hidden"); renderConversation(); renderSessionList(); }
function showSetup(){ els.chatView.classList.add("hidden"); els.setupView.classList.remove("hidden"); }

function platformName(){ const ua=navigator.userAgent; return /Windows/i.test(ua)?"Windows":/Macintosh|Mac OS/i.test(ua)?"macOS":/Android/i.test(ua)?"Android":/iPhone|iPad|iPod/i.test(ua)?"iOS / iPadOS":/Linux/i.test(ua)?"Linux":"Browser device"; }
async function analyzeDevice(){
  els.analyzeBtn.disabled=true; els.analyzeBtn.firstChild.textContent="Analyzing… "; setStatus("READING BROWSER-EXPOSED HARDWARE / NOTHING SENT TO A SERVER");
  const cores=navigator.hardwareConcurrency||0; const memory=navigator.deviceMemory||0; let adapter=null; let maxBuffer=0;
  try{ if(navigator.gpu){ adapter=await navigator.gpu.requestAdapter({powerPreference:"high-performance"}); maxBuffer=Number(adapter?.limits?.maxBufferSize||0); } }catch{}
  const webgpu=!!adapter; let score=15+(webgpu?35:0)+Math.min(20,cores*2)+(memory?Math.min(20,memory*2.5):0)+(maxBuffer>=1073741824?10:maxBuffer>=536870912?6:0); score=Math.min(100,Math.round(score));
  const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent); const stronger=webgpu&&!mobile&&(memory===0||memory>=8)&&(cores===0||cores>=6);
  recommendedModel=stronger?STRONG_MODEL:LIGHT_MODEL; recommendedName=stronger?"Llama 3.2 1B":"Qwen2 0.5B";
  els.profilePlatform.textContent=platformName(); els.profileCores.textContent=cores?String(cores):"Not exposed"; els.profileRam.textContent=memory?`~${memory} GB reported`:"Not exposed"; els.profileGpu.textContent=webgpu?"Available":"Unavailable"; els.scorePill.textContent=`MANIFEST SCORE ${score}`;
  els.modelName.textContent=stronger?"Manifest Balanced":"Manifest Fast"; els.modelTier.textContent=stronger?"Balanced browser AI":"Fast browser AI"; els.modelSize.textContent=webgpu?"WebGPU":"Unavailable"; els.modelReason.textContent=webgpu?(stronger?"This browser exposes enough capability to try the stronger browser-local model.":"Manifest recommends the lighter browser-local model for a more reliable experience."):"This browser does not expose WebGPU, which the live browser demo requires.";
  els.profileCard.classList.remove("hidden"); els.recommendCard.classList.remove("hidden"); els.installBtn.disabled=!webgpu; setStatus(webgpu?"DEVICE PROFILE COMPLETE / BROWSER AI READY TO INSTALL":"WEBGPU UNAVAILABLE / TRY A CURRENT CHROME OR EDGE BROWSER"); els.analyzeBtn.disabled=false; els.analyzeBtn.firstChild.textContent="Analyze Again ";
}
async function installModel(){
  if(loading)return; loading=true; els.installBtn.disabled=true; els.downloadWrap.classList.remove("hidden"); setStatus("INSTALLING BROWSER AI / MODEL STAYS IN THIS BROWSER CACHE");
  try{
    await runtime.prepare(recommendedModel, report=>{ const p=Math.max(0,Math.min(1,Number(report?.progress||0))); els.downloadBar.style.width=`${Math.max(3,p*100)}%`; els.downloadPercent.textContent=`${Math.round(p*100)}%`; els.downloadText.textContent=report?.text||"Preparing model…"; });
    modelReady=true; els.downloadBar.style.width="100%"; els.downloadPercent.textContent="100%"; els.downloadText.textContent="Installed and ready"; els.installBtn.textContent="Installed ✓"; els.readyCard.classList.remove("hidden"); setStatus("BROWSER AI READY / START CHATTING"); showChat();
  }catch(err){ els.installBtn.disabled=false; els.installBtn.textContent="Try Install Again ↓"; setStatus(`INSTALL ERROR / ${String(err?.message||err)}`); }
  finally{ loading=false; }
}
function updateSend(){ if(generating){els.sendBtn.disabled=false;els.sendBtn.textContent="■";els.sendBtn.classList.add("stop-mode");return;} els.sendBtn.textContent="↑";els.sendBtn.classList.remove("stop-mode"); els.sendBtn.disabled=!modelReady||!els.promptInput.value.trim(); }
function autoSize(){ els.promptInput.style.height="auto"; els.promptInput.style.height=`${Math.min(els.promptInput.scrollHeight,140)}px`; }
async function sendMessage(text){
  const clean=text.trim(); if(!clean||!modelReady)return;
  if(generating){ activeController?.abort(); runtime.stop(); return; }
  ensureSession(); history.push({role:"user",content:clean}); persistHistory(); addMessage("user",clean); activeAssistantBody=addMessage("assistant",""); generating=true; activeController=new AbortController(); els.promptInput.value=""; autoSize(); updateSend();
  let answer="";
  try{
    const messages=[{role:"system",content:SYSTEM_PROMPT},...history];
    for await(const token of runtime.chat({modelId:recommendedModel,messages,signal:activeController.signal})){ answer+=token; activeAssistantBody.innerHTML=simpleMarkdown(answer); els.messages.scrollTop=els.messages.scrollHeight; }
  }catch(err){ if(!activeController.signal.aborted)answer=answer||`I couldn't complete that locally: ${String(err?.message||err)}`; }
  if(answer){ history.push({role:"assistant",content:answer}); persistHistory(); activeAssistantBody.innerHTML=simpleMarkdown(answer); }
  generating=false; activeController=null; activeAssistantBody=null; updateSend(); els.promptInput.focus();
}

function defaultNetwork(){ return {performance:false,compute:false,learning:false,feedback:false,hours:4}; }
function loadNetwork(){ try{return {...defaultNetwork(),...(JSON.parse(localStorage.getItem(NETWORK_KEY)||"null")||{})};}catch{return defaultNetwork();} }
function readNetwork(){ return {performance:!!els.performanceToggle.checked,compute:!!els.computeToggle.checked,learning:!!els.learningToggle.checked,feedback:!!els.feedbackToggle.checked,hours:Number(els.hoursSlider.value||4)}; }
function estimateCredits(p){ return (p.performance?240:0)+(p.compute?p.hours*155:0)+(p.learning?520:0)+(p.feedback?180:0); }
function updateNetworkPreview(){ const p=readNetwork(); const count=[p.performance,p.compute,p.learning,p.feedback].filter(Boolean).length; els.hoursValue.textContent=String(p.hours); els.computeLimit.classList.toggle("disabled",!p.compute); els.creditEstimate.textContent=`${estimateCredits(p).toLocaleString()} / month`; if(count===0){els.nodeMode.textContent="PRIVATE";els.nodeModeCopy.textContent="Nothing is selected for contribution.";}else if(p.compute&&count>1){els.nodeMode.textContent="NETWORK";els.nodeModeCopy.textContent=`${count} contribution modes selected. Preview only.`;}else{els.nodeMode.textContent="SELECTIVE";els.nodeModeCopy.textContent=`${count} contribution mode${count===1?"":"s"} selected.`;} }
function updateNetworkBadge(){ const p=loadNetwork(); const count=[p.performance,p.compute,p.learning,p.feedback].filter(Boolean).length; els.networkRailStatus.textContent=count?`${count} mode${count===1?"":"s"} selected`:"Private mode"; els.networkBtn.classList.toggle("active",count>0); els.networkHeaderBtn.classList.toggle("active",count>0); els.networkHeaderBtn.textContent=count?`Network · ${count}`:"Network"; }
function openNetwork(){ const p=loadNetwork(); els.performanceToggle.checked=p.performance; els.computeToggle.checked=p.compute; els.learningToggle.checked=p.learning; els.feedbackToggle.checked=p.feedback; els.hoursSlider.value=String(p.hours||4); updateNetworkPreview(); els.networkOverlay.classList.remove("hidden"); els.networkOverlay.setAttribute("aria-hidden","false"); }
function closeNetwork(save=false){ if(save){localStorage.setItem(NETWORK_KEY,JSON.stringify(readNetwork()));updateNetworkBadge();} els.networkOverlay.classList.add("hidden");els.networkOverlay.setAttribute("aria-hidden","true"); }

els.analyzeBtn.addEventListener("click",analyzeDevice);
els.installBtn.addEventListener("click",installModel);
els.startBtn.addEventListener("click",showChat);
els.setupAgainBtn.addEventListener("click",showSetup);
els.newChatBtn.addEventListener("click",createNewChat);
els.promptInput.addEventListener("input",()=>{autoSize();updateSend();});
els.promptInput.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();els.chatForm.requestSubmit();}});
els.chatForm.addEventListener("submit",e=>{e.preventDefault();sendMessage(els.promptInput.value);});
els.networkBtn.addEventListener("click",openNetwork); els.networkHeaderBtn.addEventListener("click",openNetwork); els.networkCloseBtn.addEventListener("click",()=>closeNetwork(false)); els.networkDoneBtn.addEventListener("click",()=>closeNetwork(true)); els.networkOverlay.addEventListener("click",e=>{if(e.target===els.networkOverlay)closeNetwork(false);});
[els.performanceToggle,els.computeToggle,els.learningToggle,els.feedbackToggle,els.hoursSlider].forEach(x=>x.addEventListener("input",updateNetworkPreview));

renderSessionList(); renderConversation(); updateNetworkBadge(); updateSend();