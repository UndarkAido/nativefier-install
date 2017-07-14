const fs = require('fs');
const os = require('os');
const util = require('util');
const nativefier = require('nativefier').default;

process.argv.slice(2).forEach(function (argapp, argindex, argarray) {
  if (fs.existsSync('configs/' + argapp + '.json')) {
      console.log("Queueing " + argapp + ".");
  }else{
      console.log("There is no config file for " + argapp + "!");
      process.exit();
  }
});

process.argv.slice(2, 3).forEach(function (argapp, argindex, argarray) {//TODO fix multiple calls
    //console.log(fs.readFileSync('configs/youtube.json', 'utf8').substring(285));
    config = JSON.parse(fs.readFileSync('configs/' + argapp + '.json', 'utf8'));
    options = Object.assign(config["options"], config[os.platform()]["options"]);
    if(os.platform() == "linux"){
	options["out"] = os.homedir() + "/.nativefier"
    }
    //console.log(options["out"]);

    nativefier(options, function(error, appPath) {
	if (error) {
            console.error(error);
            return;
	}
	console.log('App has been nativefied to', appPath);
	if(os.platform() == "linux"){
	    pkginfo = JSON.parse(fs.readFileSync(appPath + '/resources/app/package.json', 'utf8'));
	    defaultdesktopfile = JSON.parse(fs.readFileSync('data/linux.desktop.json', 'utf8'));
	    var desktopstr = "[Desktop Entry]"
	    var desktopjson = Object.assign(defaultdesktopfile, config['linux'][".desktop"])
	    for (var line in desktopjson) {
		desktopstr += "\n" + line + "=" + desktopjson[line];
	    }
	    //console.log(appPath);
	    var exe = appPath.split("/").slice(-1)[0];
	    exe = exe.substring(0, exe.length - 10)
	    fs.writeFileSync(os.homedir() + "/.local/share/applications/nativefier" + exe + ".desktop", util.format(desktopstr, appPath + "/" + exe, pkginfo['name']));
	    fs.chmodSync(os.homedir() + "/.local/share/applications/nativefier" + exe + ".desktop", 0755);
	    if(config['linux']["icon"] != undefined){
		fs.createReadStream(config['linux']["icon"]).pipe(fs.createWriteStream(os.homedir() + '/.icons/' + config['linux']["icon"].split("/").slice(-1)[0]));
	    }
	}
    });
});
