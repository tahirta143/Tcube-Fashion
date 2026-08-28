const db = require('../config/db');

// Get all banners (Public)
const getBanners = async (req, res) => {
  try {
    const [banners] = await db.query('SELECT * FROM banners ORDER BY created_at DESC');
    res.status(200).json(banners);
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a banner (Admin only)
const createBanner = async (req, res) => {
  const { title, subtitle, description, image_url, link_url, type, video_url } = req.body;

  if ((!image_url && !video_url) || !type) {
    return res.status(400).json({ message: 'Either Image URL or Video URL is required, and placement type is required.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO banners (title, subtitle, description, image_url, link_url, type, video_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title || null, subtitle || null, description || null, image_url || null, link_url || null, type, video_url || null]
    );

    res.status(201).json({
      message: 'Banner created successfully',
      bannerId: result.insertId
    });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a banner (Admin only)
const deleteBanner = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query('SELECT * FROM banners WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    await db.query('DELETE FROM banners WHERE id = ?', [id]);
    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a banner (Admin only)
const updateBanner = async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, description, image_url, link_url, type, video_url } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM banners WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    const current = existing[0];

    await db.query(
      `UPDATE banners
       SET title = ?, subtitle = ?, description = ?, image_url = ?, link_url = ?, type = ?, video_url = ?
       WHERE id = ?`,
      [
        title !== undefined ? title : current.title,
        subtitle !== undefined ? subtitle : current.subtitle,
        description !== undefined ? description : current.description,
        image_url !== undefined ? image_url : current.image_url,
        link_url !== undefined ? link_url : current.link_url,
        type !== undefined ? type : current.type,
        video_url !== undefined ? video_url : current.video_url,
        id
      ]
    );

    res.status(200).json({ message: 'Banner updated successfully' });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getBanners,
  createBanner,
  deleteBanner,
  updateBanner
};
