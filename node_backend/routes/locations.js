const express = require('express');
const router = express.Router();
const { LOCATIONS } = require('../lib/locationsData');

/**
 * @route GET /api/locations/countries
 * Returns list of all available countries
 */
router.get('/countries', (req, res) => {
  res.json(Object.keys(LOCATIONS));
});

/**
 * @route GET /api/locations/states
 * Returns all states for a given country
 */
router.get('/states', (req, res) => {
  const { country } = req.query;
  if (!country) return res.status(400).json({ error: 'Country is required' });
  
  const states = LOCATIONS[country] ? Object.keys(LOCATIONS[country]) : [];
  res.json(states);
});

/**
 * @route GET /api/locations/districts
 * Returns all districts for a given state
 */
router.get('/districts', (req, res) => {
  const { country, state } = req.query;
  if (!country || !state) return res.status(400).json({ error: 'Country and state are required' });
  
  const districts = (LOCATIONS[country] && LOCATIONS[country][state]) ? LOCATIONS[country][state] : [];
  res.json(districts);
});

/**
 * @route GET /api/locations/all
 * Returns a flat list of all locations in format: Country > State > District
 */
router.get('/all', (req, res) => {
  const results = [];
  for (const country in LOCATIONS) {
    for (const state in LOCATIONS[country]) {
      for (const district of LOCATIONS[country][state]) {
        results.append({
          country,
          state,
          district,
          display: `${district}, ${state}, ${country}`,
          value: `${country}|${state}|${district}`
        });
      }
    }
  }
  res.json(results);
});

module.exports = router;
