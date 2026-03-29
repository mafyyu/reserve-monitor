const fs = require("fs");
const path = require("path");
const cron = require("node-cron");

function fileDelete(){
  const dir = "./data";

  const files = fs.readdirSync(dir).sort(); 
  const keep = 2;

  const toDelete = files.slice(0, Math.max(0, files.length - keep));

  for (const f of toDelete) {
    fs.unlinkSync(path.join(dir, f));
    console.log("deleted:", f);
  };
}

module.exports = { fileDelete };