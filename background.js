/*
 * T-Dog's AdBlocker — background service worker.
 *
 * Copyright (C) 2026 Benjamin Nelson (Nelson Agentic)
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version. This program is distributed WITHOUT ANY WARRANTY; see the
 * GNU General Public License for more details. You should have received a copy
 * of the license with this program; if not, see
 * <https://www.gnu.org/licenses/>.
 *
 * Developed with assistance from Anthropic's Claude.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// T-Dog's AdBlocker — minimal service worker.
// Blocking is done natively by Chrome's declarativeNetRequest engine.
// This worker only: (1) syncs the auto-updated + user blocklists into
// dynamic rules, (2) handles the on/off toggle, (3) wires the badge.
// It runs briefly on install/startup/daily-alarm, then goes idle.

const STATIC_RULESET = "ads";

// Dynamic-rule id ranges. The remote list is large, so it's split across
// several block rules (CHUNK domains each); user/allow rules get fixed ids.
const USER_RULE_ID = 2;
const ALLOW_RULE_ID = 3; // per-site allowlist ("trusted sites")
const REMOTE_ID_BASE = 1000; // remote block rules use 1000, 1001, 1002, …
const CHUNK = 25000; // domains per dynamic rule (stays well within DNR limits)

// The Nelson Agentic blocklist, hosted in this extension's GitHub repo and
// refreshed daily by .github/workflows/update-blocklist.yml (rebuild locally
// with scripts/build_published_list.py). raw.githubusercontent.com sends
// `Access-Control-Allow-Origin: *`, so NO host permission is needed.
const LIST_URL =
  "https://raw.githubusercontent.com/nelson-agentic/tDogsAdBlock/main/publish/nelson-agentic-blocklist.txt";

const UPDATE_ALARM = "update-blocklist";
const UPDATE_PERIOD_MIN = 24 * 60; // daily

// Only plain ASCII registrable domains are valid in a DNR requestDomains list.
// An invalid entry makes updateDynamicRules() throw, which — because the call
// is atomic — would drop ALL dynamic rules and silently fail open. So every
// list is sanitized before it reaches the API.
const DOMAIN_RE = /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/;
const MAX_DOMAINS = 400000; // defensive cap; fits OISD Big (~327k) + curated, with headroom

// Never turn the update host — or any parent of it — into a block rule, no
// matter what a list contains. If a malformed or hostile entry matched the
// host we fetch LIST_URL from, the extension would cut off its own updates
// with no way to recover. A DNR requestDomains entry matches the domain AND
// its subdomains, so an entry equal to the host or a parent of it (e.g.
// "githubusercontent.com") is dangerous; a sibling (e.g. "collector.github.com")
// is not, and stays blockable. Derived from LIST_URL so it follows the host.
const UPDATE_HOST = new URL(LIST_URL).hostname;

function isProtected(d) {
  return UPDATE_HOST === d || UPDATE_HOST.endsWith("." + d);
}

function cleanDomains(list) {
  const out = [];
  const seen = new Set();
  for (const d of list || []) {
    if (
      typeof d === "string" &&
      DOMAIN_RE.test(d) &&
      !isProtected(d) &&
      !seen.has(d)
    ) {
      seen.add(d);
      out.push(d);
      if (out.length >= MAX_DOMAINS) break;
    }
  }
  return out;
}

chrome.runtime.onInstalled.addListener(() => {
  // Chrome counts blocked requests for the badge natively — no JS per request.
  chrome.declarativeNetRequest.setExtensionActionOptions({
    displayActionCountAsBadgeText: true,
  });
  chrome.alarms.create(UPDATE_ALARM, {
    periodInMinutes: UPDATE_PERIOD_MIN,
    delayInMinutes: 1, // first fetch shortly after install
  });
  applyState();
});

chrome.runtime.onStartup.addListener(applyState);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === UPDATE_ALARM) updateRemoteList();
});

// Popup actions: manual "update now".
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "update-now") {
    updateRemoteList().then((ok) => sendResponse({ ok }));
    return true; // async response
  }
});

// React to popup changes (toggle flip, user domain add/remove).
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.enabled) applyState();
  else if (changes.userDomains || changes.allowedSites) syncDynamicRules();
});

// Enable/disable everything based on stored state.
async function applyState() {
  const { enabled = true } = await chrome.storage.local.get("enabled");
  await chrome.declarativeNetRequest.updateEnabledRulesets(
    enabled
      ? { enableRulesetIds: [STATIC_RULESET] }
      : { disableRulesetIds: [STATIC_RULESET] }
  );
  await syncDynamicRules();
  // Nelson Agentic amber when active, gray when paused.
  chrome.action.setBadgeBackgroundColor({ color: enabled ? "#d99a2b" : "#888" });
  chrome.action.setBadgeTextColor?.({ color: "#ffffff" });
}

// Fetch the remote list, sanity-check it, store it, and rebuild rules.
async function updateRemoteList() {
  try {
    const res = await fetch(LIST_URL, { cache: "no-store" });
    if (!res.ok) return false;
    const text = await res.text();
    const domains = [];
    const seen = new Set();
    for (let line of text.split("\n")) {
      line = line.trim().toLowerCase();
      if (!line || line.startsWith("#") || line.startsWith("!")) continue;
      // Handle "0.0.0.0 domain" / "127.0.0.1 domain" hosts-format lines too.
      const token = line.split(/\s+/).pop();
      if (!DOMAIN_RE.test(token) || seen.has(token)) continue;
      seen.add(token);
      domains.push(token);
      // Cap at parse time too, so a hostile/bogus payload can't balloon
      // memory or the storage.local quota before cleanDomains() runs.
      if (domains.length >= MAX_DOMAINS) break;
    }
    if (domains.length < 100) return false; // refuse a bogus/truncated payload
    await chrome.storage.local.set({
      remoteDomains: domains,
      lastUpdate: Date.now(),
    });
    await syncDynamicRules();
    return true;
  } catch {
    return false; // offline etc. — keep the previous list
  }
}

// Rebuild the dynamic rules from storage. Cheap and idempotent.
async function syncDynamicRules() {
  const {
    enabled = true,
    remoteDomains = [],
    userDomains = [],
    allowedSites = [],
  } = await chrome.storage.local.get([
    "enabled",
    "remoteDomains",
    "userDomains",
    "allowedSites",
  ]);

  const remote = cleanDomains(remoteDomains);
  const user = cleanDomains(userDomains);
  const allowed = cleanDomains(allowedSites);

  const addRules = [];
  if (enabled) {
    // Remote block list, split into CHUNK-sized rules (id 1000, 1001, …).
    for (let i = 0, id = REMOTE_ID_BASE; i < remote.length; i += CHUNK, id++) {
      addRules.push({
        id,
        priority: 1,
        action: { type: "block" },
        condition: { requestDomains: remote.slice(i, i + CHUNK) },
      });
    }
    if (user.length) {
      addRules.push({
        id: USER_RULE_ID,
        priority: 2,
        action: { type: "block" },
        condition: { requestDomains: user },
      });
    }
    if (allowed.length) {
      // "Trusted sites": allowAllRequests exempts the ENTIRE frame hierarchy
      // of any tab whose top-level page is on one of these domains. Priority
      // beats every block rule (static and dynamic).
      addRules.push({
        id: ALLOW_RULE_ID,
        priority: 100,
        action: { type: "allowAllRequests" },
        condition: {
          requestDomains: allowed,
          resourceTypes: ["main_frame"],
        },
      });
    }
  }

  try {
    // Remove whatever dynamic rules exist now, then add the fresh set —
    // handles a varying number of remote chunks cleanly.
    const current = await chrome.declarativeNetRequest.getDynamicRules();
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: current.map((r) => r.id),
      addRules,
    });
  } catch (e) {
    // Never let a rule-build error leave blocking in an unknown state.
    console.error("T-Dog's AdBlocker: failed to update dynamic rules", e);
  }
}
