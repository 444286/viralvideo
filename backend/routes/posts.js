const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// GET all posts grouped by section
router.get('/', async (req, res) => {
  try {
    const most_popular = await Post.find({ section: 'most_popular' }).sort({ order: 1, createdAt: -1 });
    const today_new = await Post.find({ section: 'today_new' }).sort({ order: 1, createdAt: -1 });
    const trending = await Post.find({ section: 'trending' }).sort({ order: 1, createdAt: -1 });

    res.json({ most_popular, today_new, trending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET posts by section
router.get('/section/:section', async (req, res) => {
  try {
    const posts = await Post.find({ section: req.params.section }).sort({ order: 1, createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
