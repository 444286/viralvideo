const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Post = require('../models/Post');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Simple admin auth middleware
const adminAuth = (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  const ADMIN_KEY = process.env.ADMIN_KEY || 'bdviral_admin_2024';
  if (key !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// GET all posts (admin view - all fields)
router.get('/posts', adminAuth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ section: 1, order: 1, createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new post
router.post('/posts', adminAuth, upload.single('thumbnail'), async (req, res) => {
  try {
    const { title, link, section, isPremium, isNew, order } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Thumbnail image required' });

    const post = new Post({
      title,
      link,
      section,
      thumbnail: req.file.filename,
      isPremium: isPremium === 'true' || isPremium === true,
      isNew: isNew === 'true' || isNew === true,
      order: parseInt(order) || 0
    });

    await post.save();
    res.status(201).json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update post
router.put('/posts/:id', adminAuth, upload.single('thumbnail'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const { title, link, section, isPremium, isNew, order } = req.body;
    post.title = title || post.title;
    post.link = link || post.link;
    post.section = section || post.section;
    post.isPremium = isPremium !== undefined ? (isPremium === 'true' || isPremium === true) : post.isPremium;
    post.isNew = isNew !== undefined ? (isNew === 'true' || isNew === true) : post.isNew;
    post.order = order !== undefined ? parseInt(order) : post.order;

    if (req.file) {
      // Delete old thumbnail
      const oldPath = path.join(__dirname, '../uploads', post.thumbnail);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      post.thumbnail = req.file.filename;
    }

    await post.save();
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE post
router.delete('/posts/:id', adminAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Delete thumbnail file
    const imgPath = path.join(__dirname, '../uploads', post.thumbnail);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);

    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET verify admin key
router.get('/verify', (req, res) => {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  const ADMIN_KEY = process.env.ADMIN_KEY || 'bdviral_admin_2024';
  res.json({ valid: key === ADMIN_KEY });
});

module.exports = router;
