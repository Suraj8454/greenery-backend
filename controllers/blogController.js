const db = require('../config/db'); const ejs = require('ejs'); const path = require('path');
const slugify = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
async function render(res, view, page, data) { const body = await ejs.renderFile(path.join(__dirname, '..', 'views', 'admin', `${view}.ejs`), data); return res.render('layouts/admin', { page, body }); }
exports.list = async (_req,res) => { try { const [rows]=await db.query("SELECT id,title,slug,excerpt,content,image,author,category,tags,hashtags,meta_title,meta_description,meta_robots,og_title,og_description,canonical_url,focus_keyword,reading_minutes,is_active,published_at,updated_at FROM blog_posts WHERE is_active=1 AND published_at IS NOT NULL AND published_at<=NOW() ORDER BY published_at DESC"); res.json(rows); } catch(e) { console.error('Blog API:',e.message); res.status(500).json({error:'Unable to load blog posts'}); } };
exports.get = async (req,res) => { try { const [rows]=await db.query("SELECT * FROM blog_posts WHERE slug=? AND is_active=1 AND published_at IS NOT NULL AND published_at<=NOW() LIMIT 1",[req.params.slug]); if(!rows.length)return res.status(404).json({error:'Article not found'}); res.json(rows[0]); } catch(e) { res.status(500).json({error:'Unable to load article'}); } };
exports.adminList = async (_req,res) => { const [posts]=await db.query('SELECT * FROM blog_posts ORDER BY updated_at DESC'); return render(res,'blog','blog',{posts}); };
function values(body,file,old={}) {
  const title=String(body.title||'').trim();
  const slug=slugify(body.slug||title);
  const active=body.status==='published'||body.is_active==='1';
  const publishedAt=active?(body.published_at||old.published_at||new Date()):null;
  const image=file?`/uploads/products/${file.filename}`:(body.image||old.image||'');
  const content=String(body.content||'').trim();
  const read=Math.max(1,Math.ceil(content.replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length/200));
  const excerpt=String(body.excerpt||'').trim();
  const metaTitle=String(body.meta_title||title).trim().slice(0,255);
  const metaDescription=String(body.meta_description||excerpt).trim().slice(0,320);
  const ogTitle=String(body.og_title||metaTitle).trim().slice(0,255);
  const ogDescription=String(body.og_description||metaDescription).trim().slice(0,320);
  const robots=['index,follow','noindex,follow','index,nofollow','noindex,nofollow'].includes(String(body.meta_robots||old.meta_robots||'index,follow'))?String(body.meta_robots||old.meta_robots||'index,follow'):'index,follow';
  return {
    title,slug,excerpt,content,image,
    author:String(body.author||'Cityscape Team').trim().slice(0,150),
    category:String(body.category||'').trim().slice(0,120),
    tags:Array.isArray(body.tags)?body.tags.join(', '):(body.tags||''),
    hashtags:String(body.hashtags||'').split(',').map(x=>x.trim().replace(/^#+/,'').replace(/[^a-zA-Z0-9_-]/g,'')).filter(Boolean).join(', '),
    meta_title:metaTitle,meta_description:metaDescription,meta_robots:robots,
    og_title:ogTitle,og_description:ogDescription,
    focus_keyword:String(body.focus_keyword||'').trim().slice(0,160),
    canonical_url:String(body.canonical_url||'').trim().slice(0,500),
    reading_minutes:Math.max(1,Math.min(120,Number(body.reading_minutes)||read)),
    is_active:active?1:0,published_at:publishedAt
  };
}
exports.create = async (req,res) => { const v=values(req.body,req.file); if(!v.title||!v.slug||!v.content)return res.status(400).send('Title, slug and content are required.'); try { await db.query('INSERT INTO blog_posts(title,slug,excerpt,content,image,author,category,tags,hashtags,meta_title,meta_description,meta_robots,og_title,og_description,focus_keyword,canonical_url,reading_minutes,is_active,published_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[v.title,v.slug,v.excerpt,v.content,v.image,v.author,v.category,v.tags,v.hashtags,v.meta_title,v.meta_description,v.meta_robots,v.og_title,v.og_description,v.focus_keyword,v.canonical_url,v.reading_minutes,v.is_active,v.published_at]);res.redirect('/admin/blog'); }catch(e){res.status(400).send('Unable to save post. The slug may already be in use. '+e.message)} };
exports.update = async (req,res) => { const [old]=await db.query('SELECT * FROM blog_posts WHERE id=?',[req.params.id]); if(!old.length)return res.status(404).send('Blog post not found'); const v=values(req.body,req.file,old[0]); if(!v.title||!v.slug||!v.content)return res.status(400).send('Title, slug and content are required.'); try{await db.query('UPDATE blog_posts SET title=?,slug=?,excerpt=?,content=?,image=?,author=?,category=?,tags=?,hashtags=?,meta_title=?,meta_description=?,meta_robots=?,og_title=?,og_description=?,focus_keyword=?,canonical_url=?,reading_minutes=?,is_active=?,published_at=? WHERE id=?',[v.title,v.slug,v.excerpt,v.content,v.image,v.author,v.category,v.tags,v.hashtags,v.meta_title,v.meta_description,v.meta_robots,v.og_title,v.og_description,v.focus_keyword,v.canonical_url,v.reading_minutes,v.is_active,v.published_at,req.params.id]);res.redirect('/admin/blog');}catch(e){res.status(400).send('Unable to update post. Check that slug is unique. '+e.message)} };
exports.remove = async (req,res) => { await db.query('DELETE FROM blog_posts WHERE id=?',[req.params.id]); res.redirect('/admin/blog'); };
