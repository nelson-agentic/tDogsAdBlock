// T-Dog's AdBlocker popup — vanilla JS, no dependencies.
const toggle = document.getElementById("toggle");
const status = document.getElementById("status");
const dot = document.getElementById("dot");
const count = document.getElementById("count");
const domainInput = document.getElementById("domainInput");
const addBtn = document.getElementById("addBtn");
const err = document.getElementById("err");
const userList = document.getElementById("userList");
const listInfo = document.getElementById("listInfo");
const updateBtn = document.getElementById("updateBtn");

// ---- Ko-fi avatar fallback ----
// If icons/icon128.png is missing, show a coffee cup instead of a broken image.
const kofiImg = document.getElementById("kofiImg");
if (kofiImg) {
  kofiImg.addEventListener("error", () => {
    const cup = document.createElement("span");
    cup.textContent = "☕";
    cup.style.fontSize = "22px";
    kofiImg.replaceWith(cup);
  });
}

// ---- On/off toggle ----
chrome.storage.local.get("enabled", ({ enabled = true }) => {
  toggle.checked = enabled;
  renderState(enabled);
});

toggle.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: toggle.checked });
  renderState(toggle.checked);
});

function renderState(enabled) {
  status.textContent = enabled ? "Blocking enabled" : "Blocking paused";
  dot.classList.toggle("off", !enabled);
}

// ---- Per-tab blocked count + current-site allowlist ----
const siteSection = document.getElementById("siteSection");
const siteName = document.getElementById("siteName");
const trustBtn = document.getElementById("trustBtn");
const trustedList = document.getElementById("trustedList");
const siteHint = document.getElementById("siteHint");
let currentSite = null;

const DOMAIN_RE = /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/;

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;

  // Accurate per-tab blocked count: read Chrome's native action count (the
  // same number shown on the toolbar badge). getMatchedRules only sees hits
  // that happened while the popup held activeTab, so it reports 0 for the
  // page load — getBadgeText reflects the real count.
  chrome.action.getBadgeText({ tabId: tab.id }, (txt) => {
    if (chrome.runtime.lastError) return;
    const n = parseInt(txt, 10);
    count.textContent = Number.isFinite(n) ? n : 0;
  });

  // Only offer "trust site" on a real registrable domain (not IPs, IPv6,
  // localhost, chrome:// pages, etc. — those can't go in a DNR domain rule).
  if (tab.url && /^https?:/.test(tab.url)) {
    const host = new URL(tab.url).hostname.replace(/^www\./, "");
    if (DOMAIN_RE.test(host)) {
      currentSite = host;
      siteName.textContent = currentSite;
      siteName.title = currentSite;
      siteSection.hidden = false;
      refreshTrusted();
    }
  }
});

function renderTrustBtn(allowedSites) {
  const trusted = currentSite && allowedSites.includes(currentSite);
  trustBtn.textContent = trusted ? "Trusted ✓ (undo)" : "Trust site";
  trustBtn.classList.toggle("trusted", trusted);
}

function renderTrustedList(allowedSites) {
  trustedList.replaceChildren();
  for (const d of allowedSites) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = d;
    span.title = d;
    const btn = document.createElement("button");
    btn.textContent = "×";
    btn.title = "Stop trusting " + d;
    btn.addEventListener("click", () => setTrusted(d, false));
    li.append(span, btn);
    trustedList.append(li);
  }
}

function refreshTrusted() {
  chrome.storage.local.get("allowedSites", ({ allowedSites = [] }) => {
    renderTrustBtn(allowedSites);
    renderTrustedList(allowedSites);
  });
}

async function setTrusted(site, trusted) {
  const { allowedSites = [] } = await chrome.storage.local.get("allowedSites");
  const next = trusted
    ? [...new Set([...allowedSites, site])].sort()
    : allowedSites.filter((x) => x !== site);
  await chrome.storage.local.set({ allowedSites: next }); // background syncs rules
  renderTrustBtn(next);
  renderTrustedList(next);
}

trustBtn.addEventListener("click", async () => {
  if (!currentSite) return;
  const { allowedSites = [] } = await chrome.storage.local.get("allowedSites");
  await setTrusted(currentSite, !allowedSites.includes(currentSite));
  siteHint.hidden = false; // trust changes apply on the next page load
});

// ---- Manual domain blocking ----
// Accepts "example.com", "https://sub.example.com/path", "sub.example.com:8080".
function normalizeDomain(raw) {
  let d = raw.trim().toLowerCase();
  if (!d) return null;
  d = d.replace(/^[a-z]+:\/\//, ""); // strip scheme
  d = d.split(/[/?#]/)[0];           // strip path
  d = d.split("@").pop();            // strip userinfo
  d = d.split(":")[0];               // strip port
  d = d.replace(/^www\./, "");
  if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(d)) return null;
  return d;
}

function renderUserList(domains) {
  userList.replaceChildren();
  for (const d of domains) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = d;
    span.title = d;
    const btn = document.createElement("button");
    btn.textContent = "×";
    btn.title = "Remove " + d;
    btn.addEventListener("click", () => removeDomain(d));
    li.append(span, btn);
    userList.append(li);
  }
}

async function addDomain() {
  err.textContent = "";
  const d = normalizeDomain(domainInput.value);
  if (!d) {
    err.textContent = "Enter a valid domain, e.g. example.com";
    return;
  }
  const { userDomains = [] } = await chrome.storage.local.get("userDomains");
  if (userDomains.includes(d)) {
    err.textContent = d + " is already blocked";
    return;
  }
  const next = [...userDomains, d].sort();
  await chrome.storage.local.set({ userDomains: next }); // background syncs rules
  domainInput.value = "";
  renderUserList(next);
}

async function removeDomain(d) {
  const { userDomains = [] } = await chrome.storage.local.get("userDomains");
  const next = userDomains.filter((x) => x !== d);
  await chrome.storage.local.set({ userDomains: next });
  renderUserList(next);
}

addBtn.addEventListener("click", addDomain);
domainInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addDomain();
});

chrome.storage.local.get("userDomains", ({ userDomains = [] }) =>
  renderUserList(userDomains)
);

// ---- Auto-updated list status ----
function renderListInfo({ remoteDomains = [], lastUpdate }) {
  if (!remoteDomains.length) {
    listInfo.textContent = "Auto-list: not fetched yet";
    return;
  }
  const when = lastUpdate ? new Date(lastUpdate).toLocaleDateString() : "?";
  listInfo.textContent =
    "Auto-list: " + remoteDomains.length.toLocaleString() + " domains · " + when;
}

chrome.storage.local.get(["remoteDomains", "lastUpdate"], renderListInfo);

updateBtn.addEventListener("click", () => {
  updateBtn.disabled = true;
  updateBtn.textContent = "Updating…";
  chrome.runtime.sendMessage({ type: "update-now" }, (res) => {
    updateBtn.disabled = false;
    updateBtn.textContent = "Update now";
    if (res?.ok) {
      chrome.storage.local.get(["remoteDomains", "lastUpdate"], renderListInfo);
    } else {
      err.textContent = "Update failed — check your connection";
    }
  });
});
