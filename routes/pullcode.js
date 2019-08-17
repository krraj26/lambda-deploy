const path = require("path");
const dir = path.join(__dirname, '../public/static/test');
const config = require("../config/gitConfig");
var exec =require("child_process").exec;


const USER = config.USER;
const PASS = config.PASS;
const REPO = config.REPO;

const git = require('simple-git/promise')(dir);
const remote = `https://${USER}:${PASS}@${REPO}`;

     git.pull((err, update) => {
       
        if(update && update.summary.changes) {
           exec("npm start");
        }
        else throw err;
     });

  // git.silent(true)
  //   .clone(remote)
  //   .then(() => res.status(200).json({ "msg": "clone successfully" }))
  //   .catch((err) => res.status(500).json({ "msg": "error occured" }));
