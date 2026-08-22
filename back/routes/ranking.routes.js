const express = require('express');
const router = express.Router();
const { getRankings } = require('../controllers/ranking.controller');

router.get('/', getRankings);

module.exports = router;
