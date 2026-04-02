/**
 * ConnectGraph – A1 Social Graph Frontend
 * Connects to Flask backend. Handles:
 *   – Trie search (live prefix filter)
 *   – Follow/Unfollow (graph edge updates)
 *   – BFS recommendation display
 *   – Graph canvas visualization (force-directed layout)
 *   – Action history (stack display)
 *   – Undo last action
 *   – Big-O complexity panel
 */

const ME = "Alice";

// Avatar color cycle (matches CSS .av-N)
const AVATAR_COLORS = 10;
const userColorMap = {};
let colorIdx = 0;
function getAvatarClass(name) {
  if (!userColorMap[name]) {
    userColorMap[name] = `av-${colorIdx % AVATAR_COLORS}`;
    colorIdx++;
  }
  return userColorMap[name];
}

// 
// INIT
// 
window.addEventListener("DOMContentLoaded", async () => {
  await refreshStats();
  await loadRecs();
  await loadHistory();
  await loadComplexity();
  initGraph();
});

// 
// TRIE SEARCH  — O(L) prefix lookup via backend Trie
// 
async function handleSearch(query) {
  const cards = document.querySelectorAll(".user-card");
  if (query.length === 0) {
    cards.forEach(c => (c.style.display = "flex"));
    return;
  }
  const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
  const matches = await res.json();
  cards.forEach(card => {
    const name = card.dataset.user;
    card.style.display = matches.includes(name) ? "flex" : "none";
  });
}

// 
// FOLLOW / UNFOLLOW  — directed graph edge add/remove
// 
document.addEventListener("click", async e => {
  if (!e.target.classList.contains("follow-btn")) return;
  const btn = e.target;
  const target = btn.dataset.user;
  const isFollowing = btn.classList.contains("unfollow-state");
  const endpoint = isFollowing ? "/unfollow" : "/follow";

  btn.disabled = true;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ me: ME, target })
    });
    const data = await res.json();

    // Toggle button state
    if (isFollowing) {
      btn.innerText = "Follow";
      btn.classList.remove("unfollow-state");
      btn.closest(".user-card").classList.remove("followed");
    } else {
      btn.innerText = "Unfollow";
      btn.classList.add("unfollow-state");
      btn.closest(".user-card").classList.add("followed");
    }

    updateNetworkList(data.following_list);
    await refreshStats();
    await loadRecs();
    await loadHistory();
    renderGraph();
    showToast(`${isFollowing ? "Unfollowed" : "Followed"} ${target}`);
  } catch (err) {
    console.error("Action failed:", err);
  } finally {
    btn.disabled = false;
  }
});

// 
// BFS RECOMMENDATIONS  — friends-of-friends engine
// 
async function loadRecs() {
  const list = document.getElementById("rec-list");
  try {
    const res = await fetch(`/recommendations/${ME}`);
    const data = await res.json();
    if (data.length === 0) {
      list.innerHTML = `<li class="empty-msg">Follow more users to see suggestions.</li>`;
    } else {
      list.innerHTML = data.map(u => `
        <li>
          <div class="rec-item">
            <span class="rec-name">${u.name}</span>
            <span class="rec-mutual">${u.count} mutual friend${u.count > 1 ? "s" : ""}</span>
          </div>
        </li>
      `).join("");
    }
  } catch (err) {
    console.error("BFS error:", err);
  }
}

// 
// STATS REFRESH  — hash map lookups on server
// 
async function refreshStats() {
  const res = await fetch(`/user_stats/${ME}`);
  const data = await res.json();
  document.getElementById("my-following-count").innerText = data.following_count;
  document.getElementById("my-follower-count").innerText = data.follower_count;
  updateNetworkList(data.following_list);

  // Update individual follower counts on cards
  const cards = document.querySelectorAll(".user-card");
  await Promise.all([...cards].map(async card => {
    const name = card.dataset.user;
    const sRes = await fetch(`/user_stats/${name}`);
    const sData = await sRes.json();
    const badge = document.getElementById(`followers-${name}`);
    if (badge) badge.innerText = `${sData.follower_count} follower${sData.follower_count !== 1 ? "s" : ""}`;
  }));
}

function updateNetworkList(list) {
  const ul = document.getElementById("following-list");
  if (!list || list.length === 0) {
    ul.innerHTML = `<li class="empty-msg">Not following anyone yet.</li>`;
  } else {
    ul.innerHTML = list.map(u => `
      <li>
        <span class="net-item"><span class="net-dot"></span>${u}</span>
      </li>
    `).join("");
  }
}

// 
// ACTION HISTORY  — stack display (most recent first)
// 
async function loadHistory() {
  const res = await fetch("/history");
  const entries = await res.json();
  const container = document.getElementById("history-list");
  if (entries.length === 0) {
    container.innerHTML = `<div class="empty-msg">No actions yet.</div>`;
    return;
  }
  container.innerHTML = entries.map(e => `
    <div class="hist-item">
      <span class="hist-tag ${e.action}">${e.action}</span>
      <span>${e.follower} → ${e.followee}</span>
    </div>
  `).join("");
}

// 
// UNDO  — stack pop + graph edge reversal
// 
async function undoLast() {
  try {
    const res = await fetch("/undo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ me: ME })
    });
    const data = await res.json();
    if (data.ok) {
      // Update the specific button
      const undone = data.undone;
      const card = document.querySelector(`[data-user="${undone.followee}"]`);
      if (card) {
        const btn = card.querySelector(".follow-btn");
        if (btn) {
          if (undone.action === "follow") {
            btn.innerText = "Follow";
            btn.classList.remove("unfollow-state");
            card.classList.remove("followed");
          } else {
            btn.innerText = "Unfollow";
            btn.classList.add("unfollow-state");
            card.classList.add("followed");
          }
        }
      }
      updateNetworkList(data.following_list);
      await refreshStats();
      await loadRecs();
      await loadHistory();
      renderGraph();
      showToast(`Undid: ${undone.action} ${undone.followee}`);
    } else {
      showToast("Nothing to undo");
    }
  } catch (err) {
    console.error("Undo failed:", err);
  }
}

// 
// COMPLEXITY PANEL  — server-returned Big-O notes
// 
async function loadComplexity() {
  const res = await fetch("/complexity");
  const data = await res.json();
  const grid = document.getElementById("complexity-grid");
  const labels = {
    follow_unfollow: "Follow / Unfollow",
    bfs_recommendation: "BFS Recommend",
    trie_search: "Trie Search",
    get_followers: "Get Followers",
    get_following: "Get Following",
    undo: "Undo Action",
    top_k_heap: "Top-K Heap",
    sorted_output: "Sorted Output"
  };
  grid.innerHTML = Object.entries(data).map(([k, v]) => `
    <div class="complexity-row">
      <span class="complexity-op">${labels[k] || k}</span>
      <span class="complexity-big-o">${v.split("—")[0].trim()}</span>
    </div>
  `).join("");
}

// 
// GRAPH CANVAS VISUALIZATION  — force-directed layout
// 
let graphData = { nodes: [], edges: [] };
let animFrame;
let simNodes = [];

async function initGraph() {
  const res = await fetch("/graph_data");
  graphData = await res.json();
  buildSim();
  renderGraph();
}

async function renderGraph() {
  const res = await fetch("/graph_data");
  graphData = await res.json();
  buildSim();
  animateSim();
}

function buildSim() {
  const canvas = document.getElementById("graph-canvas");
  const W = canvas.clientWidth || 700;
  const H = canvas.clientHeight || 240;

  // Preserve positions if nodes exist
  const posMap = {};
  simNodes.forEach(n => posMap[n.id] = { x: n.x, y: n.y, vx: n.vx, vy: n.vy });

  simNodes = graphData.nodes.map((n, i) => {
    if (posMap[n.id]) return { ...n, ...posMap[n.id] };
    const angle = (i / graphData.nodes.length) * Math.PI * 2;
    const r = Math.min(W, H) * 0.33;
    return {
      id: n.id,
      x: W / 2 + r * Math.cos(angle),
      y: H / 2 + r * Math.sin(angle),
      vx: 0, vy: 0
    };
  });
}

let simTick = 0;
function animateSim() {
  cancelAnimationFrame(animFrame);
  simTick = 0;
  function step() {
    tickPhysics();
    drawGraph();
    simTick++;
    if (simTick < 120) animFrame = requestAnimationFrame(step);
  }
  step();
}

function tickPhysics() {
  const canvas = document.getElementById("graph-canvas");
  const W = canvas.clientWidth || 700;
  const H = canvas.clientHeight || 240;
  const REPEL = 900, ATTRACT = 0.012, DAMPING = 0.85, CENTER = 0.008;

  // Repulsion
  for (let i = 0; i < simNodes.length; i++) {
    for (let j = i + 1; j < simNodes.length; j++) {
      const a = simNodes[i], b = simNodes[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = REPEL / (dist * dist);
      a.vx += force * dx / dist; a.vy += force * dy / dist;
      b.vx -= force * dx / dist; b.vy -= force * dy / dist;
    }
  }

  // Spring attraction along edges
  graphData.edges.forEach(e => {
    const a = simNodes.find(n => n.id === e.source);
    const b = simNodes.find(n => n.id === e.target);
    if (!a || !b) return;
    const dx = b.x - a.x, dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const spring = (dist - 80) * ATTRACT;
    a.vx += spring * dx / dist; a.vy += spring * dy / dist;
    b.vx -= spring * dx / dist; b.vy -= spring * dy / dist;
  });

  // Center gravity
  simNodes.forEach(n => {
    n.vx += (W / 2 - n.x) * CENTER;
    n.vy += (H / 2 - n.y) * CENTER;
    n.vx *= DAMPING; n.vy *= DAMPING;
    n.x += n.vx; n.y += n.vy;
    // Bounds
    n.x = Math.max(20, Math.min(W - 20, n.x));
    n.y = Math.max(20, Math.min(H - 20, n.y));
  });
}

function drawGraph() {
  const canvas = document.getElementById("graph-canvas");
  const ctx = canvas.getContext("2d");

  // Resize canvas to CSS size
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const myNode = simNodes.find(n => n.id === ME);
  const myFollowing = new Set(
    graphData.edges.filter(e => e.source === ME).map(e => e.target)
  );

  // Draw edges
  graphData.edges.forEach(e => {
    const a = simNodes.find(n => n.id === e.source);
    const b = simNodes.find(n => n.id === e.target);
    if (!a || !b) return;

    const isMyEdge = e.source === ME;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);

    // Draw curved edge
    const mx = (a.x + b.x) / 2 - (b.y - a.y) * 0.15;
    const my = (a.y + b.y) / 2 + (b.x - a.x) * 0.15;
    ctx.quadraticCurveTo(mx, my, b.x, b.y);

    ctx.strokeStyle = isMyEdge ? "rgba(108,117,255,0.5)" : "rgba(255,255,255,0.07)";
    ctx.lineWidth = isMyEdge ? 1.5 : 0.8;
    ctx.stroke();

    // Arrow head
    const angle = Math.atan2(b.y - my, b.x - mx);
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(b.x - r * Math.cos(angle - 0.4), b.y - r * Math.sin(angle - 0.4));
    ctx.lineTo(b.x - r * Math.cos(angle), b.y - r * Math.sin(angle));
    ctx.lineTo(b.x - r * Math.cos(angle + 0.4), b.y - r * Math.sin(angle + 0.4));
    ctx.strokeStyle = isMyEdge ? "rgba(108,117,255,0.6)" : "rgba(255,255,255,0.1)";
    ctx.lineWidth = isMyEdge ? 1.5 : 0.8;
    ctx.stroke();
  });

  // Draw nodes
  simNodes.forEach(node => {
    const isMe = node.id === ME;
    const isFollowed = myFollowing.has(node.id);
    const r = isMe ? 10 : 7;

    // Glow for Alice
    if (isMe) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(108,117,255,0.12)";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    if (isMe) {
      ctx.fillStyle = "#6c75ff";
    } else if (isFollowed) {
      ctx.fillStyle = "#3be0a8";
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.15)";
    }
    ctx.fill();

    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = isMe ? "rgba(108,117,255,0.8)" : isFollowed ? "rgba(59,224,168,0.5)" : "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Label
    ctx.font = `500 10px 'IBM Plex Mono', monospace`;
    ctx.fillStyle = isMe ? "#a0a6ff" : isFollowed ? "#3be0a8" : "rgba(255,255,255,0.45)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(node.id, node.x, node.y + r + 3);
  });
}

// 
// RESET
// 
async function resetDemo() {
  if (!confirm("Reset graph to initial seed state?")) return;
  await fetch("/reset", { method: "POST" });
  window.location.reload();
}

// 
// TOAST
// 
let toastTimer;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.innerText = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}