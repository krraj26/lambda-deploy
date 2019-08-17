var express = require('express');
const path = require('path');
const fs = require('fs');
var writeData = require('write-data');
const yaml = require("js-yaml");
//const movefile = require("mv");
var router = express.Router();
const directoryPath = path.join(__dirname, '../public/static/test');
const commitDir = path.join(__dirname, '../public/commitDir');
const convertDir = path.join(__dirname, '../public/convertDIR')
var request = require('request');


/* GET home page. */
router.get('/', function (req, res, next) {
	request('http://localhost:3000/list', function (error, response, body) {
		console.log('error:', error); // Print the error if one occurred
		console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
		console.log(body);
		res.render('index', { title: 'test', directories: JSON.parse(body) });
	});
});


router.get('/list', function (req, res, next) {

	let array = [];
	fs.readdir(directoryPath, function (err, files) {

		if (err) {
			res.json(err);
		}

		files.forEach(function (fileName) {

			console.log(fileName);

			var filePath = path.join(directoryPath, fileName);
			var stat = fs.statSync(filePath);
			//console.log("stat" +stat);

			if (stat.isFile()) {
			}
			else if (stat.isDirectory() && fileName.indexOf('.') == -1) {
				array.push({ fileName: fileName, filePath: filePath });

			}
		});
		res.json(array);
	});
});


router.post('/dir', function (req, res, next) {
	//console.log(req.body.filePath)
	let testPath = directoryPath;
	testPath = req.body.filePath;

	console.log("testpath" + testPath);

	let array = [];
	fs.readdir(testPath, function (err, files) {

		if (err) {
			res.json(err);
		}

		cleanAndCopy(commitDir);

		files.forEach(function (fileName) {

			console.log(fileName);

			var filePath = path.join(testPath, fileName);
			var stat = fs.statSync(filePath);

			if (stat.isFile() && fileName.indexOf(".js") !== -1) {

				var dotIndex = fileName.lastIndexOf(".");
				var name = fileName.slice(0, dotIndex)
				var newName = name + path.extname(fileName);

				var read = fs.createReadStream(path.join(filePath));
				var write = fs.createWriteStream(path.join(commitDir, newName));
				read.pipe(write);

				array.push({ fileName: fileName, filePath: filePath });
			}
		});
		res.json(array);
	});
});

cleanAndCopy = function (newDir) {
	return new Promise(function (resolve, reject) {
		fs.readdir(newDir, function (err, files) {
			if (err) {
				res.json(err);
			}
			files.forEach(function (fileName) {
				fs.unlink(path.join(newDir, fileName), err => {
					if (err) throw err;
				});
			});
		});
	});
}

router.post("/deploy", function (res, req, nest) {
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

