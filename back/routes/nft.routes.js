const express = require('express');
const router = express.Router();
const { getNfts, getNftById, createNft, updateNft, deleteNft } = require('../controllers/nft.controller');
const protect = require('../middleware/auth.middleware');

router.get('/', getNfts);
router.get('/:id', getNftById);
router.post('/', protect, createNft);
router.put('/:id', protect, updateNft);
router.delete('/:id', protect, deleteNft);

module.exports = router;
