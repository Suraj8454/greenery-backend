const r=require('express').Router(); const db=require('../../config/db');
r.get('/',async(_req,res)=>{try{const [rows]=await db.query('SELECT * FROM home_sections WHERE is_active=1 ORDER BY sort_order,id');res.json(rows.map(x=>({...x,items:parse(x.items_json)})));}catch(e){res.status(500).json({error:'Unable to load website sections'});}});
r.get('/:key',async(req,res)=>{try{const [rows]=await db.query('SELECT * FROM home_sections WHERE section_key=? AND is_active=1 LIMIT 1',[req.params.key]);if(!rows.length)return res.status(404).json({error:'Section not found'});const x=rows[0];res.json({...x,items:parse(x.items_json)});}catch(e){res.status(500).json({error:'Unable to load section'});}});
function parse(v){try{return JSON.parse(v||'[]')}catch{return []}}
module.exports=r;
