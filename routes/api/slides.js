const r=require('express').Router(); const c=require('../../controllers/contentController'); r.get('/',c.listSlides); module.exports=r;
