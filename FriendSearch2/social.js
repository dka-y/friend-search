/**
 * ConnectGraph Social Engine
 * Handles: BFS Recommendations, Trie Search, and Adjacency List Updates
 */

const ME = "Alice";

// --- 1. Initialization ---
window.onload = async () => {
    console.log("ConnectGraph Initialized for:", ME);
    
    // Initial data sync for pre-seeded data
    const res = await fetch(`/user_stats/${ME}`);
    const data = await res.json();
    
    // Populate the 'Your Network' list with pre-seeded connections
    updateFollowingList(data.following_list);
    
    // Load BFS suggestions and global counts
    await updateAllStats();
    await loadRecs();
};

// --- 2. Trie-Based Search Logic ---
async function handleSearch(query) {
    const userCards = document.querySelectorAll('.user-card');
    
    // If search is empty, show all nodes (users)
    if (query.length === 0) {
        userCards.forEach(c => c.style.display = 'flex');
        return;
    }

    // Query the Trie on the backend O(L) complexity
    const res = await fetch(`/search?q=${query}`);
    const matches = await res.json();
    
    userCards.forEach(card => {
        const name = card.id.replace('card-', '');
        // Filter UI based on Trie results
        card.style.display = matches.includes(name) ? 'flex' : 'none';
    });
}

// --- 3. Follow/Unfollow Event Listener ---
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('follow-btn')) {
        const btn = e.target;
        const target = btn.getAttribute('data-user');
        
        // Use classList to check state for color consistency
        const isFollowing = btn.classList.contains('unfollow-state');
        
        const endpoint = isFollowing ? '/unfollow' : '/follow';
        
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ me: ME, target: target })
            });
            const data = await res.json();
            
            // Toggle UI state: Blue (Follow) vs Red (Unfollow)
            if (isFollowing) {
                btn.innerText = "Follow";
                btn.classList.remove('unfollow-state');
            } else {
                btn.innerText = "Unfollow";
                btn.classList.add('unfollow-state');
            }
            
            // Re-sync UI with new Graph state
            updateFollowingList(data.following_list);
            await updateAllStats();
            await loadRecs(); // Re-run BFS for updated recommendations
            
        } catch (error) {
            console.error("Action failed:", error);
        }
    }
});

// --- 4. BFS Recommendation Engine Trigger ---
async function loadRecs() {
    const list = document.getElementById('rec-list');
    try {
        const res = await fetch(`/recommendations/${ME}`);
        const data = await res.json(); // Array of {name, count}
        
        if (data.length === 0) {
            list.innerHTML = "<li>Follow more users to see suggestions.</li>";
        } else {
            list.innerHTML = data.map(u => `
                <li>
                    <strong>${u.name}</strong>
                    <div style="font-size: 0.8rem; color: #65676b;">
                        ${u.count} mutual friend${u.count > 1 ? 's' : ''}
                    </div>
                </li>
            `).join('');
        }
    } catch (err) {
        console.error("BFS calculation error:", err);
    }
}

// --- 5. UI Stats Synchronization ---
async function updateAllStats() {
    // Update Alice's header stats
    const res = await fetch(`/user_stats/${ME}`);
    const data = await res.json();
    document.getElementById('my-following-count').innerText = data.following_count;
    document.getElementById('my-follower-count').innerText = data.follower_count;

    // Update individual follower badges on cards
    const cards = document.querySelectorAll('.user-card');
    for (let card of cards) {
        const name = card.id.replace('card-', '');
        const sRes = await fetch(`/user_stats/${name}`);
        const sData = await sRes.json();
        const badge = document.getElementById(`followers-${name}`);
        if (badge) badge.innerText = `${sData.follower_count} followers`;
    }
}

// Update the "Your Network" sidebar list
function updateFollowingList(list) {
    const ul = document.getElementById('following-list');
    if (!list || list.length === 0) {
        ul.innerHTML = "<li>Not following anyone yet.</li>";
    } else {
        ul.innerHTML = list.map(u => `<li>${u}</li>`).join('');
    }
}

// --- 6. Reset Demo Logic ---
async function resetDemo() {
    if (!confirm("Reset the social graph to the initial pre-seeded state?")) return;

    try {
        await fetch('/reset', { method: 'POST' });
        // Refresh the page to re-initialize everything from the server
        window.location.reload(); 
    } catch (err) {
        alert("Reset failed.");
    }
}