// =====================================================
// CONTROLLERS/NFT.CONTROLLER.JS
// CRUD for NFT listings.
// =====================================================

const Nft = require('../modules/nft');

// Fields to pull in from a populated creator/owner — never the whole
// User document (would otherwise leak password hash field selection,
// email, etc. into a public listings response).
const PUBLIC_USER_FIELDS = 'username avatarUrl';

// GET /api/nfts
// Public. Supports:
//   ?category=Art            filter by category
//   ?creator=<userId>        e.g. Profile page's "Created" tab
//   ?owner=<userId>          e.g. Profile page's "Owned" tab
//   ?page=1&limit=12         pagination (defaults match the Marketplace grid)
async function getNfts(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);

    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.creator) filter.creator = req.query.creator;
    if (req.query.owner) filter.owner = req.query.owner;

    const [nfts, total] = await Promise.all([
      Nft.find(filter)
        .populate('creator', PUBLIC_USER_FIELDS)
        .populate('owner', PUBLIC_USER_FIELDS)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Nft.countDocuments(filter),
    ]);

    res.status(200).json({
      nfts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get NFTs error:', err.message);
    res.status(500).json({ message: 'Something went wrong while fetching NFTs' });
  }
}

// GET /api/nfts/:id
// Public.
async function getNftById(req, res) {
  try {
    const nft = await Nft.findById(req.params.id)
      .populate('creator', PUBLIC_USER_FIELDS)
      .populate('owner', PUBLIC_USER_FIELDS);

    if (!nft) {
      return res.status(404).json({ message: 'NFT not found' });
    }

    res.status(200).json({ nft });
  } catch (err) {
    // Covers malformed ObjectIds (CastError) as a plain 404 rather than a 500 —
    // from the client's perspective "not a real id" and "doesn't exist" are the same thing
    console.error('Get NFT error:', err.message);
    res.status(404).json({ message: 'NFT not found' });
  }
}

// POST /api/nfts — protected
// Creates a listing owned by the logged-in user. creator and owner start
// out identical; owner is the field that would change on a future sale.
async function createNft(req, res) {
  try {
    const { title, description, imageUrl, category, price, highestBid } = req.body;

    if (!title || !imageUrl || !category || price === undefined) {
      return res.status(400).json({ message: 'title, imageUrl, category, and price are all required' });
    }

    const nft = await Nft.create({
      title,
      description,
      imageUrl,
      category,
      price,
      highestBid,
      creator: req.user._id,
      owner: req.user._id,
    });

    res.status(201).json({ message: 'NFT created successfully', nft });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error('Create NFT error:', err.message);
    res.status(500).json({ message: 'Something went wrong while creating the NFT' });
  }
}

// PUT /api/nfts/:id — protected, current owner only
async function updateNft(req, res) {
  try {
    const nft = await Nft.findById(req.params.id);

    if (!nft) {
      return res.status(404).json({ message: 'NFT not found' });
    }

    if (nft.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the current owner can edit this NFT' });
    }

    const editableFields = ['title', 'description', 'imageUrl', 'category', 'price', 'highestBid'];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) nft[field] = req.body[field];
    });

    await nft.save();
    res.status(200).json({ message: 'NFT updated successfully', nft });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error('Update NFT error:', err.message);
    res.status(500).json({ message: 'Something went wrong while updating the NFT' });
  }
}

// DELETE /api/nfts/:id — protected, current owner only
async function deleteNft(req, res) {
  try {
    const nft = await Nft.findById(req.params.id);

    if (!nft) {
      return res.status(404).json({ message: 'NFT not found' });
    }

    if (nft.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the current owner can delete this NFT' });
    }

    await nft.deleteOne();
    res.status(200).json({ message: 'NFT deleted successfully' });
  } catch (err) {
    console.error('Delete NFT error:', err.message);
    res.status(500).json({ message: 'Something went wrong while deleting the NFT' });
  }
}

module.exports = { getNfts, getNftById, createNft, updateNft, deleteNft };
