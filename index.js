// WARNING: arbitrary file access!!! and injection attacks if you enable proc
const enable_proc = true;
const enable_proc_args = true;
const default_preprocessor = "lua_cmdlineprepend";

const fs = require('fs');
const child = require('child_process');
const path = require('path');
const express = require('express');
var app = express();


(function(){
  const p = fs.Dir.prototype
  if (p.hasOwnProperty(Symbol.iterator)) { return }
  const entriesSync = function* () {
    try {
      let dirent
      while ((dirent = this.readSync()) !== null) { yield dirent }
    } finally { this.closeSync() }
  }
  if (!p.hasOwnProperty(entriesSync)) { p.entriesSync = entriesSync }
  Object.defineProperty(p, Symbol.iterator, {
    configurable: true,
    enumerable: false,
    value: entriesSync,
    writable: true
  })
})()

app.use(express.text({limit: "400kb", type: "*/*"}));
(function(){
  let todo = (req,res)=>{
    if (req.query.proc==undefined && default_preprocessor) {
      req.query.proc=default_preprocessor
    } else if (req.query.proc=="null") {
      req.query.proc=undefined
    }
    let split = req.path.split(path.sep);
    var npath, pre;
    if (split[0]=="") {split=split.slice(1)}
    npath=path.join("public",split.slice(1).join(path.sep));
    console.log(req.ip, req.ips, split[0], npath);
    if (split[0]=="") {
      pre=""
    } else if (split[0]=="f") {
      try {
        pre=fs.readFileSync("preload")
      } catch (e) {
        return res.sendStatus(500)
      }
    } else {
      try {
        pre=fs.readFileSync("preload/".concat(split[0]))
      } catch (e) {
        return res.sendStatus(500)
      }
    }
    try{req.query.extra=parseInt(req.query.extra)} catch {}
    try {
      let source = pre.toString().concat(fs.readFileSync(npath))
      if (req.query.ptb4 && typeof(req.query.proc)=="string" && enable_proc) {
        source=child.execSync("process/".concat(req.query.proc)
                              .concat(" ")
                              .concat((typeof(req.query.proc_arg)=="string" && enable_proc_args ? req.query.proc_arg : "")
                              .concat(" -")),{
          //maxBuffer: maxbuf,
          input: source
        }).toString()
      }
      source=((typeof(req.query.extra_char)=="string" && typeof(req.query.extra)=="number") ? req.query.extra_char.repeat(req.query.extra) : "").concat(source)
      source=(typeof(req.query.extra_suffix)=="string" ? req.query.extra_suffix : "").concat(source)
      if (req.query.pta4!==false && typeof(req.query.proc)=="string" && enable_proc) {
        source=child.execSync("process/".concat(req.query.proc)
                              .concat(" ")
                              .concat((typeof(req.query.proc_arg)=="string" && enable_proc_args ? req.query.proc_arg : "")
                              .concat(" -")),{
          //maxBuffer: maxbuf,
          input: source
        }).toString()
      }
      res.status(200).send(source);
    } catch (e) {
      res.sendStatus(500);
    }
  }
  let stat = fs.statSync("preload",{throwIfNoEntry: false})
  if (stat==undefined) {fs.mkdirSync("preload");stat=fs.statSync("preload")};
  if (stat.isDirectory()) {
    let d = fs.opendirSync("preload")
    for (const file of d) {
      console.log("Registered preload path /"+file.name+"/*");
      app.get("/"+file.name+"/*",todo);
    }
  } else if (stat.isFile()) {
    console.log("Registered preload path /f/*");
    app.get("/f/*",todo);
  }
  app.get("//*",todo);
})();
app.listen(8000,()=>{console.log("Running.")})