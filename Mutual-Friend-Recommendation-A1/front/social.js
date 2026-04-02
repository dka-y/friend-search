// ═══════════════════════════════════════════════════════════════
// ALL DSA IMPLEMENTED IN PURE JS — no backend needed
// ═══════════════════════════════════════════════════════════════

const ME = "Alice";
const AVATAR_COLORS = ["av-0","av-1","av-2","av-3","av-4","av-5","av-6","av-7","av-8","av-9"];

// ── SEED DATA ──────────────────────────────────────────────────
const USERS = ["Alice","Bob","Carol","David","Eve","Frank","Grace","Hank","Ivy","Jack"];

const INITIAL_FOLLOWS = [
  ["Alice","Bob"],["Alice","Carol"],
  ["Bob","David"],["Bob","Eve"],
  ["Carol","David"],["Carol","Frank"],
  ["David","Grace"],["Eve","Frank"],
  ["Eve","Grace"],["Frank","Hank"],
  ["Grace","Ivy"],["Hank","Jack"],["Ivy","Jack"]
];

// ── DATA STRUCTURES ────────────────────────────────────────────

// 1. GRAPH — Adjacency List: Map<string, Set<string>>
let graph = new Map();

// 2. TRIE — nested objects for O(L) prefix search
let trie = {};

// 3. STACK — action history for undo (max 50)
let actionStack = [];

// ── TRIE OPERATIONS — O(L) insert, O(L+R) search ──────────────
function trieInsert(word) {
  let node = trie;
  for (const ch of word.toLowerCase()) {
    if (!node[ch]) node[ch] = {};
    node = node[ch];
  }
  node["$"] = word; // terminal stores original-case name
}

function trieSearch(prefix) {
  let node = trie;
  for (const ch of prefix.toLowerCase()) {
    if (!node[ch]) return [];
    node = node[ch];
  }
  // BFS collect all terminals under this prefix node
  const results = [];
  const queue = [node];
  while (queue.length) {
    const curr = queue.shift();
    for (const key of Object.keys(curr)) {
      if (key === "$") results.push(curr[key]);
      else queue.push(curr[key]);
    }
  }
  return results;
}

// ── GRAPH OPERATIONS ───────────────────────────────────────────
function addFollow(follower, followee) {
  if (!graph.has(follower)) graph.set(follower, new Set());
  if (!graph.has(followee)) graph.set(followee, new Set());
  graph.get(follower).add(followee);
  actionStack.push({ action: "follow", follower, followee, ts: Date.now() });
  if (actionStack.length > 50) actionStack.shift();
}

function removeFollow(follower, followee) {
  if (graph.has(follower)) graph.get(follower).delete(followee);
  actionStack.push({ action: "unfollow", follower, followee, ts: Date.now() });
  if (actionStack.length > 50) actionStack.shift();
}

function getFollowing(user) {
  return [...(graph.get(user) || [])].sort();
}

function getFollowers(user) {
  return [...graph.entries()]
    .filter(([, s]) => s.has(user))
    .map(([u]) => u);
}

// ── BFS RECOMMENDATION ENGINE ─────────────────────────────────
// Complexity: O(V+E) BFS + O(R log K) heap extraction
function bfsRecommendations(me, topK = 5) {
  const myFollowing = graph.get(me) || new Set();
  const visited = new Set([me, ...myFollowing]);
  const queue = [...myFollowing]; // BFS queue (deque simulation)

  // Hash Map: candidate → mutual friend count
  const mutualCount = new Map();

  while (queue.length) {
    const friend = queue.shift();
    for (const fof of (graph.get(friend) || [])) {
      if (!visited.has(fof)) {
        visited.add(fof);
        queue.push(fof);
      }
      // Count how many of MY friends also follow this person
      if (fof !== me && !myFollowing.has(fof)) {
        mutualCount.set(fof, (mutualCount.get(fof) || 0) + 1);
      }
    }
  }

  // Refine: count exactly how many of my friends follow each candidate
  const refined = new Map();
  for (const [candidate] of mutualCount) {
    let count = 0;
    for (const f of myFollowing) {
      if ((graph.get(f) || new Set()).has(candidate)) count++;
    }
    if (count > 0) refined.set(candidate, count);
  }

  // Max-Heap simulation: sort descending by count, then by name (merge sort / TimSort)
  const entries = [...refined.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return entries.slice(0, topK); // top-K extraction
}

// ── UNDO — Stack pop ──────────────────────────────────────────
function undoLastAction(me) {
  for (let i = actionStack.length - 1; i >= 0; i--) {
    const entry = actionStack[i];
    if (entry.follower === me) {
      actionStack.splice(i, 1);
      if (entry.action === "follow") {
        graph.get(me)?.delete(entry.followee);
      } else {
        if (!graph.has(me)) graph.set(me, new Set());
        graph.get(me).add(entry.followee);
      }
      return entry;
    }
  }
  return null;
}

// ── INIT ──────────────────────────────────────────────────────
function initGraph() {
  graph.clear();
  trie = {};
  actionStack.length = 0;

  USERS.forEach(u => {
    graph.set(u, new Set());
    trieInsert(u);
  });
  INITIAL_FOLLOWS.forEach(([a, b]) => graph.get(a).add(b));
}

// ═══════════════════════════════════════════════════════════════
// UI RENDERING
// ═══════════════════════════════════════════════════════════════

function buildUserGrid() {
  const grid = document.getElementById("user-grid");
  const myFollowing = getFollowing(ME);
  grid.innerHTML = USERS.filter(u => u !== ME).map((user, i) => {
    const isFollowed = myFollowing.includes(user);
    const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
    return `
      <div class="user-card ${isFollowed ? "followed" : ""}" data-user="${user}">
        <div class="card-top">
          <div class="avatar ${av}">${user[0]}</div>
          <div class="card-info">
            <div class="card-name">${user}</div>
            <div class="card-followers" id="followers-${user}">— followers</div>
          </div>
        </div>
        <button class="follow-btn ${isFollowed ? "unfollow-state" : ""}" data-user="${user}">
          ${isFollowed ? "Unfollow" : "Follow"}
        </button>
      </div>`;
  }).join("");
  updateFollowerBadges();
}

function updateFollowerBadges() {
  USERS.filter(u => u !== ME).forEach(user => {
    const badge = document.getElementById(`followers-${user}`);
    if (badge) {
      const count = getFollowers(user).length;
      badge.innerText = `${count} follower${count !== 1 ? "s" : ""}`;
    }
  });
}

function renderStats() {
  const following = getFollowing(ME);
  const followers = getFollowers(ME);
  document.getElementById("my-following-count").innerText = following.length;
  document.getElementById("my-follower-count").innerText = followers.length;
  renderNetworkList(following);
}

function renderNetworkList(list) {
  const ul = document.getElementById("following-list");
  if (!list.length) {
    ul.innerHTML = `<li class="empty-msg">Not following anyone yet.</li>`;
  } else {
    ul.innerHTML = list.map(u =>
      `<li><span class="net-item"><span class="net-dot"></span>${u}</span></li>`
    ).join("");
  }
}

function renderRecs() {
  const list = document.getElementById("rec-list");
  const recs = bfsRecommendations(ME);
  if (!recs.length) {
    list.innerHTML = `<li class="empty-msg">Follow more users to see suggestions.</li>`;
  } else {
    list.innerHTML = recs.map(u => `
      <li>
        <div class="rec-item">
          <span class="rec-name">${u.name}</span>
          <span class="rec-mutual">${u.count} mutual friend${u.count > 1 ? "s" : ""}</span>
        </div>
      </li>`).join("");
  }
}

function renderHistory() {
  const container = document.getElementById("history-list");
  const recent = [...actionStack].reverse().slice(0, 20);
  if (!recent.length) {
    container.innerHTML = `<div class="empty-msg">No actions yet.</div>`;
    return;
  }
  container.innerHTML = recent.map(e => `
    <div class="hist-item">
      <span class="hist-tag ${e.action}">${e.action}</span>
      <span>${e.follower} → ${e.followee}</span>
    </div>`).join("");
}

function renderComplexity() {
  const ops = [
    ["Follow / Unfollow", "O(1)"],
    ["BFS Recommend",     "O(V + E)"],
    ["Trie Search",       "O(L + R)"],
    ["Get Followers",     "O(V)"],
    ["Get Following",     "O(1)"],
    ["Undo Action",       "O(1)"],
    ["Top-K Extraction",  "O(R log K)"],
    ["Sorted Output",     "O(R log R)"],
  ];
  document.getElementById("complexity-grid").innerHTML = ops.map(([op, bigo]) => `
    <div class="complexity-row">
      <span class="complexity-op">${op}</span>
      <span class="complexity-big-o">${bigo}</span>
    </div>`).join("");
}

function refreshAll() {
  renderStats();
  renderRecs();
  renderHistory();
  updateFollowerBadges();
  renderGraph();
}

// ── TRIE SEARCH handler ───────────────────────────────────────
function handleSearch(query) {
  const cards = document.querySelectorAll(".user-card");
  if (!query.trim()) {
    cards.forEach(c => c.style.display = "flex");
    return;
  }
  const matches = trieSearch(query);
  cards.forEach(card => {
    card.style.display = matches.includes(card.dataset.user) ? "flex" : "none";
  });
}

// ── FOLLOW / UNFOLLOW ─────────────────────────────────────────
document.addEventListener("click", e => {
  if (!e.target.classList.contains("follow-btn")) return;
  const btn = e.target;
  const target = btn.dataset.user;
  const isFollowing = btn.classList.contains("unfollow-state");

  if (isFollowing) {
    removeFollow(ME, target);
    btn.innerText = "Follow";
    btn.classList.remove("unfollow-state");
    btn.closest(".user-card").classList.remove("followed");
    showToast(`Unfollowed ${target}`);
  } else {
    addFollow(ME, target);
    btn.innerText = "Unfollow";
    btn.classList.add("unfollow-state");
    btn.closest(".user-card").classList.add("followed");
    showToast(`Following ${target}`);
  }

  refreshAll();
});

// ── UNDO ──────────────────────────────────────────────────────
function undoLast() {
  const result = undoLastAction(ME);
  if (!result) { showToast("Nothing to undo"); return; }

  // Re-sync the specific button
  const card = document.querySelector(`[data-user="${result.followee}"]`);
  if (card) {
    const btn = card.querySelector(".follow-btn");
    if (result.action === "follow") {
      btn.innerText = "Follow";
      btn.classList.remove("unfollow-state");
      card.classList.remove("followed");
    } else {
      btn.innerText = "Unfollow";
      btn.classList.add("unfollow-state");
      card.classList.add("followed");
    }
  }

  refreshAll();
  showToast(`Undid: ${result.action} ${result.followee}`);
}

// ── RESET ─────────────────────────────────────────────────────
function resetDemo() {
  if (!confirm("Reset graph to initial seed state?")) return;
  initGraph();
  buildUserGrid();
  refreshAll();
  showToast("Graph reset");
}

// ═══════════════════════════════════════════════════════════════
// GRAPH CANVAS — Force-directed visualization
// ═══════════════════════════════════════════════════════════════

let simNodes = [];
let animFrame;
let simTick = 0;

function initSimNodes() {
  const canvas = document.getElementById("graph-canvas");
  const W = canvas.clientWidth || 700;
  const H = canvas.clientHeight || 240;

  simNodes = USERS.map((id, i) => {
    const existing = simNodes.find(n => n.id === id);
    if (existing) return existing;
    const angle = (i / USERS.length) * Math.PI * 2;
    const r = Math.min(W, H) * 0.33;
    return { id, x: W/2 + r*Math.cos(angle), y: H/2 + r*Math.sin(angle), vx: 0, vy: 0 };
  });
}

function renderGraph() {
  cancelAnimationFrame(animFrame);
  initSimNodes();
  simTick = 0;
  function step() {
    tickPhysics();
    drawGraph();
    simTick++;
    if (simTick < 150) animFrame = requestAnimationFrame(step);
  }
  step();
}

function tickPhysics() {
  const canvas = document.getElementById("graph-canvas");
  const W = canvas.clientWidth || 700;
  const H = canvas.clientHeight || 240;
  const REPEL = 900, ATTRACT = 0.012, DAMPING = 0.85, CENTER = 0.008;

  // Repulsion between all node pairs
  for (let i = 0; i < simNodes.length; i++) {
    for (let j = i + 1; j < simNodes.length; j++) {
      const a = simNodes[i], b = simNodes[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      const force = REPEL / (dist * dist);
      a.vx += force*dx/dist; a.vy += force*dy/dist;
      b.vx -= force*dx/dist; b.vy -= force*dy/dist;
    }
  }

  // Spring attraction along edges
  for (const [src, targets] of graph.entries()) {
    const a = simNodes.find(n => n.id === src);
    for (const tgt of targets) {
      const b = simNodes.find(n => n.id === tgt);
      if (!a || !b) continue;
      const dx = b.x-a.x, dy = b.y-a.y;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      const spring = (dist - 80) * ATTRACT;
      a.vx += spring*dx/dist; a.vy += spring*dy/dist;
      b.vx -= spring*dx/dist; b.vy -= spring*dy/dist;
    }
  }

  // Center gravity + damping + bounds
  simNodes.forEach(n => {
    n.vx += (W/2 - n.x) * CENTER;
    n.vy += (H/2 - n.y) * CENTER;
    n.vx *= DAMPING; n.vy *= DAMPING;
    n.x += n.vx; n.y += n.vy;
    n.x = Math.max(22, Math.min(W-22, n.x));
    n.y = Math.max(22, Math.min(H-22, n.y));
  });
}

function drawGraph() {
  const canvas = document.getElementById("graph-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const myFollowing = graph.get(ME) || new Set();

  // Draw edges
  for (const [src, targets] of graph.entries()) {
    const a = simNodes.find(n => n.id === src);
    for (const tgt of targets) {
      const b = simNodes.find(n => n.id === tgt);
      if (!a || !b) continue;
      const isMyEdge = src === ME;
      ctx.beginPath();
      const mx = (a.x+b.x)/2 - (b.y-a.y)*0.15;
      const my = (a.y+b.y)/2 + (b.x-a.x)*0.15;
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(mx, my, b.x, b.y);
      ctx.strokeStyle = isMyEdge ? "rgba(108,117,255,0.55)" : "rgba(255,255,255,0.07)";
      ctx.lineWidth = isMyEdge ? 1.5 : 0.8;
      ctx.stroke();
      // Arrow head
      const angle = Math.atan2(b.y - my, b.x - mx);
      const r = 8;
      ctx.beginPath();
      ctx.moveTo(b.x - r*Math.cos(angle-0.4), b.y - r*Math.sin(angle-0.4));
      ctx.lineTo(b.x - r*Math.cos(angle),     b.y - r*Math.sin(angle));
      ctx.lineTo(b.x - r*Math.cos(angle+0.4), b.y - r*Math.sin(angle+0.4));
      ctx.strokeStyle = isMyEdge ? "rgba(108,117,255,0.6)" : "rgba(255,255,255,0.1)";
      ctx.lineWidth = isMyEdge ? 1.5 : 0.8;
      ctx.stroke();
    }
  }

  // Draw nodes
  simNodes.forEach(node => {
    const isMe = node.id === ME;
    const isFollowed = myFollowing.has(node.id);
    const r = isMe ? 10 : 7;

    if (isMe) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 16, 0, Math.PI*2);
      ctx.fillStyle = "rgba(108,117,255,0.12)";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI*2);
    ctx.fillStyle = isMe ? "#6c75ff" : isFollowed ? "#3be0a8" : "rgba(255,255,255,0.15)";
    ctx.fill();
    ctx.strokeStyle = isMe ? "rgba(108,117,255,0.8)" : isFollowed ? "rgba(59,224,168,0.5)" : "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = `500 10px 'IBM Plex Mono', monospace`;
    ctx.fillStyle = isMe ? "#a0a6ff" : isFollowed ? "#3be0a8" : "rgba(255,255,255,0.45)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(node.id, node.x, node.y + r + 3);
  });
}

// ── TOAST ─────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.innerText = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

// ── BOOT ──────────────────────────────────────────────────────
initGraph();
buildUserGrid();
refreshAll();
renderComplexity();