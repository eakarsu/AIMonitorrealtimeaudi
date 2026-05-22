const express = require('express');
const router = express.Router();

router.post('/matrix', (req, res) => {
  const { driverId = 'unknown', events = [], fatigueScore = 0, incidentCount30d = 0 } = req.body || {};
  const eventRows = Array.isArray(events) ? events : [];
  const severityPoints = eventRows.reduce((sum, event) => sum + ({ low: 5, medium: 12, high: 25, critical: 40 }[event.severity] || 5), 0);
  const score = Math.min(100, severityPoints + Number(fatigueScore) * 0.4 + Number(incidentCount30d) * 8);
  res.json({
    feature: 'Driver Coaching Escalation Matrix',
    driverId,
    score: Math.round(score),
    tier: score >= 80 ? 'supervisor intervention' : score >= 55 ? 'mandatory coaching' : score >= 30 ? 'targeted coaching' : 'routine feedback',
    coachingPlan: [
      score >= 55 ? 'Schedule documented coaching session within 48 hours.' : 'Send targeted micro-coaching prompt.',
      eventRows.some((e) => e.type === 'fatigue') ? 'Review rest compliance and route assignment.' : 'Review trend again after next shift.',
      'Attach events to safety record for audit traceability.',
    ],
  });
});

module.exports = router;
