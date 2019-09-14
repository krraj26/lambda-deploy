const fs = require("fs");
const path = require("path");
var writeData = require('write-data');
const git = require('simple-git');
const config = require("../config/aws.json");
var lambdaDir = path.join(__dirname, '../public/static/lambda-pipeline-repo-pst');
var configlambda = path.join(__dirname, '../public/static/lambda-pipeline-repo-pst/config.json');
const AWS = require('aws-sdk');
const awsConfig = require("../config/pipeline.json");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);
var statusInterval;
var fileConvertor = {

    tiggerPoint: function () {
        return new Promise((resolve, reject) => {
            _self = this;
          return _self.deployeCode()
                .then(data => {
                    _self.pipelineSucceed()
                        .then(data => { resolve(data); })
                        .catch(err => { reject(err); })
                })
                .catch(err => reject(err))

        })
    },

    buildConversion: function () {
        return new Promise((resolve, reject) => {
            try {
                var buildFile = {
                    "version": 0.2,
                    "phases": {
                        "install": {
                            "runtime-versions": {
                                "nodejs": 10
                            }
                        },
                        "build": {
                            "commands": [
                                "npm install",
                                "export BUCKET=lambda-pipeine-s3-pst",
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

                fs.readdir(lambdaDir, function (err, data) {
                    if (err) {
                        console.log(err)
                    }
                    else {

                        writeData(lambdaDir + '/buildspec.yml', buildFile, function (err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve("success");
                            }
                        })
                    }
                })

            } catch (error) {
                console.log("please check build file " + error)
            }
        })
    },

    templateConfigchange: function () {
        return new Promise((resolve, reject) => {
            try {
                if (fs.existsSync(configlambda)) {
                    fs.readFile(configlambda, 'utf-8', function (err, data) {
                        if (err) reject(err);
                        else {
                            let getData = JSON.parse(data);
                            let status = getData.statusCode;

                            // console.log(status);
                            var i = 0;
                            var integrationResponses = [];
                            for (var j = 0; j < status.length; j++) {
                                var obj = {
                                    "StatusCode": status[j].status
                                }
                                integrationResponses.push(obj);
                            }
                            //console.log(integrationResponses);
                            //var params = getData.queryParameter;
                            //console.log(params)

                            // var parameters = [];
                            // for (var j = 0; j < params.length; j++) {
                            //     var obj = params[j]
                            //     parameters.push(obj);
                            // }
                            // //console.log(parameters);

                            // var queryParam = {};
                            // queryParam[getData.method] = { "parameters": parameters }

                            var resources = {};
                            resources[getData.lambda] = {
                                "Type": "AWS::Serverless::Function",
                                "Properties": {
                                    "Handler": getData.name + ".handler",
                                    "Runtime": "nodejs10.x",
                                    "CodeUri": "./",
                                    "Events": {
                                        "MyTimeApi": {
                                            "Type": "Api",
                                            "Properties": {
                                                "Path": getData.path,
                                                "Method": getData.method,
                                            },

                                            "Integration": {
                                                "CacheKeyParameters": [
                                                    "method.request.path.proxy"
                                                ],
                                                "RequestParameters": {
                                                    "integration.request.path.proxy": "method.request.path.proxy"
                                                },

                                                "Type": "AWS_PROXY",
                                                "PassthroughBehavior": "WHEN_NO_MATCH",
                                                "IntegrationResponses": integrationResponses
                                            }
                                        }
                                    }

                                }
                            };
                            var template = {
                                "AWSTemplateFormatVersion": "2010-09-09",
                                "Transform": "AWS::Serverless-2016-10-31",
                                "Description": "Outputs the time",
                                "Resources": resources
                            }
                            fs.readdir(lambdaDir, function (err, data) {
                                if (err) { reject(err); }
                                else {

                                    writeData(lambdaDir + '/template.yaml', template, function (err) {
                                        if (err) {
                                            reject(err);
                                        } else {
                                            resolve("success");
                                        }
                                    })
                                }
                            });
                        }
                    })

                }
            } catch (error) {
                reject("Please provide config file" + error)
            }

        });
    },
    codeCommitToAWS: function () {
        return new Promise((resolve, reject) => {
            const USER = config.USER;
            const PASS = config.PASS;
            const REPO = config.REPO;
            const gitHubUrl = `https://${USER}:${PASS}@${REPO}`;

            try {
                git(lambdaDir).add('./*')
                    .commit("first commit!")
                    .push(['-u', 'origin', 'master'],
                        () => {

                            resolve("files pushed to AWS repository successfully");
                        });
            } catch (error) {

                reject("code commit error" + error);
            }
        });
    },
    pipelineExecute: function () {
        return new Promise((resolve, reject) => {
            const config = {
                accessKeyId: awsConfig.aws_access_key_id,
                secretAccessKey: awsConfig.aws_secret_access_key,
                region: awsConfig.region
            }
            var codepipeline = new AWS.CodePipeline(config);
            var params = {
                name: 'lambda-pipeline-dev'
            };
            codepipeline.startPipelineExecution(params, function (err, data) {
                if (err) { reject("pipeline error" + err) }
                else {

                    resolve('AWS pipeline run Successfully ');
                }
            });
        })
    },
    pipelineInterval: function () {
        return new Promise((resolve, reject) => {

            try {
                statusInterval = setInterval(() => {
                    _self.pipelineSucceed()
                        .then(data => { resolve(data); })
                        .catch(err => { reject(err); });
                }, 40000);
            } catch (error) {
                console.log("pipeline errr"+error)
            }
           
        });
    },
    pipelineSucceed: function () {
        return new Promise((resolve, reject) => {

            const config = {
                accessKeyId: awsConfig.aws_access_key_id,
                secretAccessKey: awsConfig.aws_secret_access_key,
                region: awsConfig.region
            }
            var codepipeline = new AWS.CodePipeline(config);
            var params = {
                name: 'lambda-pipeline-dev'
            };
            codepipeline.getPipelineState(params, function (err, data) {
                if (err) {
                    reject("pipeline error" + err)
                }
                else {
                    try {
                
              //  console.log(JSON.stringify(data));  
                    
                    // if (source == "Succeeded" && build == "Succeeded" && deploy == "Succeeded") {

                    //     clearInterval(statusInterval);
                        resolve(data);

                    // }
                    // else if (source == "Failed" || build == "Failed" || deploy == "Failed") {

                    //     clearInterval(statusInterval);
                    //     reject('pipeline executation failed');

                    // }
                    } catch (error) {
                        console.log("new pipeline" +error)
                    }
                }
            });
        });
    },

    deployeCode: async function () {
        await _self.templateConfigchange().then(data => { console.log("template file " + data) }).catch(err => { console.log(err) });
        await _self.buildConversion().then(data => { console.log("buildspec file " + data) }).catch(err => { console.log(err) });
        await _self.codeCommitToAWS().then(data => { console.log(data) }).catch(err => { console.log(err) });
        await _self.pipelineExecute().then(data => { console.log(data) }).catch(err => { console.log(err) });
        // await _self.pipelineInterval().then(data => { console.log(data) }).catch(err => { console.log(err) });

    }
}
module.exports = fileConvertor;