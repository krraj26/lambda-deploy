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

router.post("/deploy", function (res, req, nest) {

	const directoryPath = path.join(__dirname, '../public/static/test');
	const commitDir = path.join(__dirname, '../public/commitDir');
	const convertDir = path.join(__dirname, '../public/convertDIR')
	var request = require('request');

	// let commitTestPath = commitDir;
	// commitTestPath = req.body.filePath;

	let array = [];
	fs.readdir(commitDir, function (err, files) {
		if (err) {
			//res.json(err);
			console.log(err);
		}

		files.forEach(function (fileName) {
			console.log(fileName);

			var DIRfilePath = path.join(directoryPath, fileName);

			console.log("Directory is :" + DIRfilePath);

			var filePath = path.join(commitDir, fileName);
			console.log(filePath);

			var stat = fs.statSync(filePath);

			if (stat.isFile() && fileName.indexOf(".js") !== -1) {

				array.push({ fileName: fileName });

				var dotIndex = fileName.lastIndexOf(".");
				var name = fileName.slice(0, dotIndex)
				var newName = name + path.extname(fileName);

				var read = fs.createReadStream(path.join(filePath));
				fs.unlink(filePath, (err) => {
					if (err) {
						console.error(err)
					}
					console.log("File removed successfully :" + fileName);
				});

				var write = fs.createWriteStream(path.join(convertDir, newName));
				read.pipe(write);

				const customer = {
					"AWSTemplateFormatVersion": "2010-09-09",
					"Transform": "AWS::Serverless-2016-10-31",
					"Description": "Outputs the time",
					"Resources": {
						"TimeFunction": {
							"Type": "AWS::Serverless::Function",
							"Properties": {
								"Handler": name + ".handler",
								"Runtime": "nodejs10.x",
								"CodeUri": "./",
								"Events": {
									"MyTimeApi": {
										"Type": "Api",
										"Properties": {
											"Path": "/TimeResource",
											"Method": "GET"
										}
									}
								}
							}
						}
					}
				}
				const jsonString = JSON.stringify(customer);

				fs.readFile(convertDir + '/' + newName, function (err, data) {
					if (err) { console.log(err); }
					else {
						{ //console.log("Content is :" +data);

							var js = JSON.stringify(data);
							//  console.log(js);

							writeData(convertDir + '/template.yaml', customer, function (err) {
								if (err) {
									console.log(err);
								} else {
									console.log("saved");
								}
							})
						}
					}
				});

				fs.readFile(convertDir + '/' + newName, function (err, data) {
					if (err) { console.log(err); }
					else {
						{ //console.log("Content is :" +data);

							var js = JSON.stringify(data);
							//  console.log(js);

							writeData(convertDir + '/buildspec.yaml', customer, function (err) {
								if (err) {
									console.log(err);
								} else {
									console.log("saved");
								}
							})
						}
					}
				});

			}
		});

		//console.log(array);
	});
	//res.json(array);
});
module.exports = router;

