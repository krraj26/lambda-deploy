var express = require('express');
var router = express.Router();
var pullCode = require("./pullcode");

/* GET users listing. */
router.get('/', function(req, res, next) {
  pullCode(res);
  res.send('cloning under progress');
});

module.exports = router;
