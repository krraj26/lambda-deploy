var express = require('express');
var router = express.Router();
const path = require('path');
const fs = require('fs');
var writeData = require('write-data');
const yaml = require("js-yaml");
//const movefile = require("mv");
var util = require('../util/utility');

router.get('/directories', function (req, res, next) {
	util.pullCode()
		.then(data => console.log(data))
		.catch(err => res.status(400).json(err));
		
	util.listRepoDirectories()
		.then(data => res.json(data))
		.catch(err => res.status(400).json(err));

});

router.post('/files', function (req, res, next) {
	
	let testPath = req.body.filePath;
		util.copyFilesToCommitDir(testPath)
		.then(data => res.json(data))
		.catch(err => res.status(400).json(err));
	
});

router.get('/execute/:dirName', function (req, res, next) {
	if(req.params && req.params.dirName){
		util.convertJStoYaml(req.params.dirName)
		.then(data => res.json(data))
		.catch(err => res.status(400).json(err));
	}else{
		res.status(400).json("path variable missing!");
	}
	

});
module.exports = router;

