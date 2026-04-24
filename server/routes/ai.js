const path = require('path');
const express = require('express');
const router = express.Router();
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

function callOpenRouter(prompt, context) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: [
        {
          role: 'system',
          content: 'You are an AI safety analyst for a transportation and logistics company. Provide detailed, actionable analysis. Always respond with structured insights including: Summary, Key Findings, Risk Assessment, and Recommendations. Use professional language.'
        },
        { role: 'user', content: `${prompt}\n\nContext data: ${JSON.stringify(context)}` }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Transport Safety Monitor'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) {
            resolve({ analysis: `AI Service Note: ${parsed.error.message || 'Service temporarily unavailable. Please check your OpenRouter API key in .env file.'}`, raw: parsed });
          } else {
            const content = parsed.choices?.[0]?.message?.content || 'No analysis available';
            resolve({ analysis: content, model: parsed.model, usage: parsed.usage });
          }
        } catch (e) {
          resolve({ analysis: 'Unable to parse AI response. Please verify your OpenRouter API key.', raw: body });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ analysis: `AI service connection error: ${e.message}. Please check your network and API key.` });
    });

    req.write(data);
    req.end();
  });
}

// Analyze driver safety
router.post('/analyze-driver', async (req, res) => {
  try {
    const result = await callOpenRouter(
      'Analyze this driver\'s safety profile and provide risk assessment, behavioral patterns, and improvement recommendations.',
      req.body
    );
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Analyze incident
router.post('/analyze-incident', async (req, res) => {
  try {
    const result = await callOpenRouter(
      'Analyze this transportation incident. Identify root causes, contributing factors, severity assessment, and preventive measures.',
      req.body
    );
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Route safety analysis
router.post('/analyze-route', async (req, res) => {
  try {
    const result = await callOpenRouter(
      'Analyze this transportation route for safety risks. Consider weather, terrain, traffic patterns, and historical incident data. Provide safety score and recommendations.',
      req.body
    );
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Vehicle health prediction
router.post('/predict-maintenance', async (req, res) => {
  try {
    const result = await callOpenRouter(
      'Analyze this vehicle\'s maintenance data and predict upcoming maintenance needs. Identify potential failures and provide preventive maintenance schedule.',
      req.body
    );
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Threat assessment
router.post('/assess-threat', async (req, res) => {
  try {
    const result = await callOpenRouter(
      'Perform a comprehensive threat assessment for this transportation scenario. Evaluate security risks, recommend countermeasures, and provide threat level rating.',
      req.body
    );
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Fatigue analysis
router.post('/analyze-fatigue', async (req, res) => {
  try {
    const result = await callOpenRouter(
      'Analyze this driver fatigue data. Assess risk level, identify contributing factors, and recommend rest schedules and interventions.',
      req.body
    );
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Emergency response
router.post('/emergency-response', async (req, res) => {
  try {
    const result = await callOpenRouter(
      'Generate an emergency response plan for this situation. Include immediate actions, resource deployment, communication protocols, and follow-up procedures.',
      req.body
    );
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Weather impact analysis
router.post('/analyze-weather', async (req, res) => {
  try {
    const result = await callOpenRouter(
      'Analyze the impact of these weather conditions on transportation safety. Provide route recommendations, speed advisories, and driver alerts.',
      req.body
    );
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Compliance check
router.post('/check-compliance', async (req, res) => {
  try {
    const result = await callOpenRouter(
      'Review this compliance data against transportation safety regulations. Identify violations, gaps, and provide remediation steps.',
      req.body
    );
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// General safety analysis
router.post('/general-analysis', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const result = await callOpenRouter(prompt || 'Provide a comprehensive safety analysis.', context || {});
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
