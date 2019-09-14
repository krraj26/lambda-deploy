var express = require('express');
var router = express.Router();
const path = require('path');
const fs = require('fs');
var writeData = require('write-data');

var util = require('../util/utility');
var pipliner = require('../routes/convertJStoYaml');

router.get('/directories', function (req, res, next) {
	util.devRepoClone()
		.then(data => res.json(data))
		.catch(err => res.status(400).json(err));

	util.AwsRepoClone()
		.then(data => res.json(data))
		.catch(err => res.status(400).json(err));



	util.listRepoDirectories()
		.then(data => res.json(data))
		.catch(err => res.status(400).json(err));

});

router.get('/pullfiles', function (req, res, next) {
	util.syncPullCode()
		.then(data => res.json(data))
		.catch(err => res.status(400).json(err));
})

router.post('/files', function (req, res, next) {

	let testPath = req.body.filePath;

	util.deleteFiles()
		.then(data => console.log(data))
		.catch(err => res.status(400).json(err));

	util.copyFilesToAwsRepo(testPath)
		.then(data => res.json(data))
		.catch(err => res.status(400).json(err));

});

router.get('/execute/:dirName', function (req, res, next) {
	
	if(req.params && req.params.dirName){
		util.convertJStoYaml(req.params.dirName)
		.then(data => res.status(200).json(data))
		.catch(err => res.status(400).json(err));
	}else{
		res.status(400).json("path variable missing!");
	}
	
});

router.get('/status', function (req, res, next) {
	
	pipliner.pipelineSucceed()
		.then(data => res.status(200).json(data))
		.catch(err => res.status(400).json(err));
	
});
module.exports = router;

