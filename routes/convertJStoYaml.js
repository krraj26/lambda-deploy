const fs = require("fs");
const path = require("path");
var writeData = require('write-data');
const commitDir = path.join(__dirname, '../public/commitDir');
if (!fs.existsSync(commitDir)) fs.mkdirSync(commitDir, { recursive: true });
const convertDir = path.join(__dirname, '../public/convertDIR')
if (!fs.existsSync(convertDir)) fs.mkdirSync(convertDir, { recursive: true });
const yaml = require("js-yaml");

var fileConvertor = {

    tiggerPoint: function () {

        console.log("Directory is :" + commitDir);

        let array = [];
        fs.readdir(commitDir, function (err, files) {
            if (err) {
                console.log(err);
            }

            files.forEach(function (fileName) {
                console.log(fileName);

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

                    const templateYAML = {
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

                    const buildYaml = {
                        "version": 0.2,
                        "phases": {
                            "install": {
                                "runtime-versions": {
                                    "nodejs": 10
                                }
                            },
                            "build": {
                                "commands": [
                                    "npm install time",
                                    "export BUCKET=lambda-deployment-artifacts-123456789012",
                                    "aws cloudformation package --template-file template.yaml --s3-bucket $BUCKET --output-template-file outputtemplate.yaml"
                                ]
                            }
                        },
                        "artifacts": {
                            "type": "zip",
                            "files": [
                                "template.yaml",
                                "outputtemplate.yaml"
                            ]
                        }
                    }
                   // const jsonString = JSON.stringify(templateYAML);

                    fs.readFile(convertDir + '/' + newName, function (err, data) {
                        if (err) { console.log(err); }
                        else {

                            var js = JSON.stringify(data);

                            writeData(convertDir + '/template.yaml', templateYAML, function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("saved");
                                }
                            })
                        }
                    });

                    fs.readFile(convertDir + '/' + newName, function (err, data) {
                        if (err) { console.log(err); }
                        else {

                            var js = JSON.stringify(data);

                            writeData(convertDir + '/buildspec.yaml', buildYaml, function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("saved");
                                }
                            })
                        }
                    });
                }
            });
            console.log(array);
        });

    }

}

module.exports = fileConvertor;