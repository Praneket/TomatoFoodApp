const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');

const BUCKET = 'tomato-images';

// Lazy init — only create client when actually needed
let _supabase = null;
const getSupabase = () => {
  if (_supabase) return _supabase;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY env vars are required for image uploads');
  }
  _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  return _supabase;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

const uploadToSupabase = async (file, folder = 'restaurants') => {
  const supabase = getSupabase();
  const filename = `${folder}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
  const { error } = await supabase.storage.from(BUCKET).upload(filename, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
};

module.exports = { upload, uploadToSupabase };
