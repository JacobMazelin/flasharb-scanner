// ViralSign Widget - Add this to the FlashArb landing page
(function() {
  // Generate or retrieve user ID
  function getUserId() {
    let userId = localStorage.getItem('flasharb_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('flasharb_user_id', userId);
    }
    return userId;
  }
  
  // Track referral from URL
  function trackReferral() {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode && !localStorage.getItem('flasharb_referred')) {
      fetch(`http://${API_HOST}/api/referral/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: refCode,
          newUserId: getUserId()
        })
      }).then(() => {
        localStorage.setItem('flasharb_referred', 'true');
      });
    }
  }
  
  // Load referral stats
  async function loadReferralStats() {
    const userId = getUserId();
    
    // Get user's referral code
    const refRes = await fetch(`http://${API_HOST}/api/referral/${userId}`);
    const refData = await refRes.json();
    
    // Get global stats
    const statsRes = await fetch(`http://${API_HOST}/api/referral/stats`);
    const statsData = await statsRes.json();
    
    // Update UI
    updateReferralWidget(refData, statsData);
  }
  
  function updateReferralWidget(refData, statsData) {
    // Check if widget exists
    let widget = document.getElementById('viral-sign-widget');
    if (!widget) {
      // Create widget
      widget = document.createElement('div');
      widget.id = 'viral-sign-widget';
      widget.style.cssText = `
        background: linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(123,44,191,0.1) 100%);
        border: 1px solid rgba(0,212,255,0.3);
        border-radius: 16px;
        padding: 24px;
        margin: 24px 0;
        text-align: center;
      `;
      
      // Insert after upgrade banner
      const upgradeBanner = document.querySelector('.upgrade-banner');
      if (upgradeBanner) {
        upgradeBanner.after(widget);
      } else {
        document.querySelector('.opportunities-section').before(widget);
      }
    }
    
    // Render widget content
    widget.innerHTML = `
      <h3 style="color: #00d4ff; margin-bottom: 12px;">🎁 Get Premium FREE</h3>
      <p style="color: #aaa; margin-bottom: 16px;">
        ${statsData.message}<br>
        Share FlashArb with friends and unlock real-time alerts
      </p>
      
      ${refData.premium ? `
        <div style="background: rgba(0,255,136,0.1); border: 1px solid #00ff88; border-radius: 8px; padding: 12px; color: #00ff88;">
          ✅ You have LIFETIME PREMIUM! Thanks for sharing.
        </div>
      ` : `
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 12px;">
            ${[1,2,3].map(i => `
              <div style="width: 40px; height: 40px; border-radius: 50%; background: ${i <= refData.referrals ? '#00ff88' : 'rgba(255,255,255,0.1)'}; display: flex; align-items: center; justify-content: center; font-weight: bold; color: ${i <= refData.referrals ? '#000' : '#fff'};">
                ${i <= refData.referrals ? '✓' : i}
              </div>
            `).join('')}
          </div>
          <p style="color: #888; font-size: 0.9rem;">
            ${refData.referrals}/3 friends joined • ${3 - refData.referrals} more for lifetime premium
          </p>
        </div>
        
        <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
          <code style="color: #00d4ff; font-size: 0.9rem;">${refData.shareUrl}</code>
          <button onclick="copyReferralLink('${refData.shareUrl}')" style="margin-left: 12px; background: #00d4ff; color: #000; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600;">
            Copy
          </button>
        </div>
        
        <a href="${refData.twitterShare}" target="_blank" style="display: inline-block; background: #1da1f2; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Share on Twitter
        </a>
      `}
    `;
  }
  
  // Copy referral link
  window.copyReferralLink = function(url) {
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied! Share with friends to unlock premium.');
    });
  };
  
  // Initialize
  trackReferral();
  loadReferralStats();
  
  // Refresh every 30 seconds
  setInterval(loadReferralStats, 30000);
})();
