// WP-029: LeaderboardService — extracted from app.js
// Handles leaderboard rendering

import { getLeaderboard } from './firebase.js?v=3';
import { sanitize } from './utils.js?v=3';

export class LeaderboardService {
    constructor({ state }) {
        this.state = state;
    }

    async render() {
        const tbody = document.getElementById('leaderboard-tbody');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px;">Loading ranks... ⏳</td></tr>`;

        try {
            const data = await getLeaderboard();
            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px; color: var(--text-muted);">No linguists found on the server. Be the first!</td></tr>`;
                return;
            }

            tbody.innerHTML = data.map(user => {
                let badge = '';
                if (user.rank === 1) badge = '🥇';
                else if (user.rank === 2) badge = '🥈';
                else if (user.rank === 3) badge = '🥉';
                else badge = `#${user.rank}`;

                const isMe = user.uid === this.state.uid;

                return `<tr style="${isMe ? 'background-color: var(--surface-hover); font-weight: bold;' : ''}">
                    <td style="text-align: center; font-size: 1.2rem;">${badge}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${user.photoURL || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%2364748b\'><path d=\'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\'/></svg>'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
                            <span>${sanitize(user.displayName)}</span>
                        </div>
                    </td>
                    <td style="text-align: center; color: var(--primary); font-weight: bold;">${user.totalWords}</td>
                </tr>`;
            }).join('');
        } catch(e) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px; color: var(--warning);">Error fetching leaderboard data.</td></tr>`;
        }
    }
}
