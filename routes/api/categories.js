const r=require('express').Router(); const c=require('../../controllers/contentController'); r.get('/',c.listCategories); module.exports=r;
