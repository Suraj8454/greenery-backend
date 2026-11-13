const r=require('express').Router(); const c=require('../../controllers/blogController'); r.get('/',c.list); r.get('/:slug',c.get); module.exports=r;
