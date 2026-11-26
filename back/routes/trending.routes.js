const express = require('express');
const router = express.Router();
const { getTrendingNfts, getTrendingCategories } = require('../controllers/trending.controller');

router.get('/nfts', getTrendingNfts);
router.get('/categories', getTrendingCategories);

module.exports = router;
