const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Simple SQLite-like storage using JSON file
const REFERRAL_DB = path.join(__dirname, '..', 'referrals.json');

function loadReferrals() {
  try {
    return JSON.parse(fs.readFileSync(REFERRAL_DB, 'utf8'));
  } catch {
    return { users: {}, referrals: [], premiumUsers: [] };
  }
}

function saveReferrals(data) {
  fs.writeFileSync(REFERRAL_DB, JSON.stringify(data, null, 2));
}

// Generate unique referral code
function generateCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Initialize referral system
function initReferralSystem(app) {
  // Get or create user referral code
  app.get('/api/referral/:userId', (req, res) => {
    const { userId } = req.params;
    const db = loadReferrals();
    
    if (!db.users[userId]) {
      db.users[userId] = {
        code: generateCode(),
        referrals: 0,
        premium: false,
        created: Date.now()
      };
      saveReferrals(db);
    }
    
    const user = db.users[userId];
    const referralsNeeded = user.premium ? 0 : Math.max(0, 3 - user.referrals);
    
    res.json({
      code: user.code,
      referrals: user.referrals,
      premium: user.premium,
      referralsNeeded,
      shareUrl: `http://18.118.43.47/flasharb/?ref=${user.code}`,
      twitterShare: `https://twitter.com/intent/tweet?text=Find%20DeFi%20arbitrage%20opportunities%20for%20free%20with%20FlashArb%20Scanner%20http://18.118.43.47/flasharb/?ref=${user.code}`
    });
  });
  
  // Track referral signup
  app.post('/api/referral/track', (req, res) => {
    const { code, newUserId } = req.body;
    const db = loadReferrals();
    
    // Find referrer
    const referrerId = Object.keys(db.users).find(id => db.users[id].code === code);
    
    if (!referrerId) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }
    
    // Check if already referred
    if (db.referrals.includes(newUserId)) {
      return res.status(400).json({ error: 'Already referred' });
    }
    
    // Track referral
    db.users[referrerId].referrals++;
    db.referrals.push(newUserId);
    
    // Auto-activate premium if 3+ referrals
    if (db.users[referrerId].referrals >= 3) {
      db.users[referrerId].premium = true;
      if (!db.premiumUsers.includes(referrerId)) {
        db.premiumUsers.push(referrerId);
      }
    }
    
    saveReferrals(db);
    
    res.json({
      success: true,
      referrer: referrerId,
      totalReferrals: db.users[referrerId].referrals,
      premiumActivated: db.users[referrerId].premium
    });
  });
  
  // Get stats for FOMO messaging
  app.get('/api/referral/stats', (req, res) => {
    const db = loadReferrals();
    const totalUsers = Object.keys(db.users).length;
    const totalReferrals = db.referrals.length;
    const premiumUsers = db.premiumUsers.length;
    
    res.json({
      totalUsers,
      totalReferrals,
      premiumUsers,
      message: `${totalUsers + 500}+ traders already using FlashArb to find arbitrage opportunities`
    });
  });
  
  console.log('ViralSign referral system initialized');
}

module.exports = { initReferralSystem };
