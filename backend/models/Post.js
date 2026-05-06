const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  thumbnail: { type: String, required: true }, // filename stored in uploads/
  link: { type: String, required: true }, // telegram/external link
  section: {
    type: String,
    enum: ['most_popular', 'today_new', 'trending'],
    required: true
  },
  badge: { type: String, default: 'HD' }, // HD, PREMIUM, NEW
  isPremium: { type: Boolean, default: true },
  isNew: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);
