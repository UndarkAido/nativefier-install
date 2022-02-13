const fs = require('fs');
const os = require('os');
const util = require('util');
const nativefier = require('nativefier').default;
const ws = require('windows-shortcuts');
const xml2js = require('xml2js');

function processSnowyDuneXML(xml, name, id, path) {
    var contains = false;
    xml["Shortcuts"]["Shortcut"].forEach(function (shortcut) {
        if (shortcut["Id"][0] == id) {
            contains = true;
        }
    });
    if (!contains) {
        xml["Shortcuts"]["Shortcut"].push({
            Name: [name],
            Id: [id],
            Path: [path],
            Arguments: [''],
            RunAsAdmin: ['false'],
            SingleInstance: ['false']
        });
    }
    var builder = new xml2js.Builder();
    var built = builder.buildObject(xml);
    fs.writeFile(process.env.APPDATA + "/Microsoft/Windows/Start Menu/Programs/Nativefier/nativefier.xml", built, function (err) {
        if (err) {
            return console.log(err);
        }
    });
}

process.argv.slice(2).forEach(function (argapp, argindex, argarray) {
    if (fs.existsSync(__dirname + '/configs/' + argapp + '.json')) {
        console.log("Queueing " + argapp + ".");
    } else {
        console.log("There is no config file for " + argapp + "!");
        process.exit();
    }
});

process.argv.slice(2, 3).forEach(function (argapp, argindex, argarray) {//TODO fix multiple calls
    //console.log(fs.readFileSync('configs/youtube.json', 'utf8').substring(285));
    config = JSON.parse(fs.readFileSync(__dirname + '/configs/' + argapp + '.json', 'utf8'));
    options = Object.assign(config["options"], config[os.platform()]["options"]);
    //console.log(options["out"]);

    var currentapi = 2
    if (config["version"] === currentapi) {
        options = Object.assign(config["options"], config[os.platform()]["options"]);
        if (os.platform() === "linux") {
            options["out"] = os.homedir() + "/.nativefier"
        }
        if (os.platform() === "win32") {
            options["out"] = os.homedir() + "/AppData/Roaming/Nativefier"
        }
        //console.log(options["out"]);
        if (os.platform() === "win32") {
            options["icon"] = __dirname + "\\" + options["icon"];
        } else {
            options["icon"] = __dirname + "/" + options["icon"];
        }

        if ("inject" in options) {
            options["inject"].forEach(function (script) {
                script = __dirname + script;
            });
        }

        nativefier(options, function (error, appPath) {
            if (error) {
                console.error(error);
                return;
            }
            console.log('App has been nativefied to', appPath);
            pkginfo = JSON.parse(fs.readFileSync(appPath + '/resources/app/package.json', 'utf8'));
            if (os.platform() === "linux") {
                var exe = appPath.split("/").slice(-1)[0];
                exe = exe.substring(0, exe.length - 10);
                defaultdesktopfile = JSON.parse(fs.readFileSync('data/linux.desktop.json', 'utf8'));
                var desktopstr = "[Desktop Entry]"
                var desktopjson = Object.assign(defaultdesktopfile, config['linux'][".desktop"])
                for (var line in desktopjson) {
                    desktopstr += "\n" + line + "=" + desktopjson[line];
                }
                //console.log(appPath);
                fs.writeFileSync(os.homedir() + "/.local/share/applications/nativefier" + exe + ".desktop", util.format(desktopstr, appPath + "/" + exe, pkginfo['name']));
                fs.chmodSync(os.homedir() + "/.local/share/applications/nativefier" + exe + ".desktop", 0o0755);
                if (config['linux']["iconsrc"] != undefined) {
                    fs.createReadStream(config['linux']["iconsrc"]).pipe(fs.createWriteStream(os.homedir() + "/.icons/" + desktopjson["Icon"] + "." + config['linux']["iconsrc"].split(".").slice(-1)[0]));
                }
                //console.log(appPath);
                fs.writeFileSync(os.homedir() + "/.local/share/applications/nativefier" + exe + ".desktop", util.format(desktopstr, appPath + "/" + exe, pkginfo['name']));
                fs.chmodSync(os.homedir() + "/.local/share/applications/nativefier" + exe + ".desktop", 0o0755);
                if (config['linux']["icon"] != undefined) {
                    fs.createReadStream(config['linux']["icon"]).pipe(fs.createWriteStream(os.homedir() + '/.icons/' + config['linux']["icon"].split("/").slice(-1)[0]));
                }
            } else if (os.platform() == "win32") {
                var exe = appPath.split("\\").slice(-1)[0];
                exe = exe.substring(0, exe.length - 10);
                //console.log("Creating shortcut")
                var lnkpath = "%APPDATA%/Microsoft/Windows/Start Menu/Programs/Nativefier/" + config["win32"]["name"] + ".lnk"
                console.log(lnkpath);
                var exepath = appPath + "\\" + exe + ".exe";
                console.log(exepath);
                ws.create(
                    lnkpath,
                    exepath,
                    function (err) {
                        if (err)
                            throw Error(err);
                        else
                            console.log("Shortcut created!");
                    }
                );
                if (fs.existsSync(process.env.APPDATA + "/Microsoft/Windows/Start Menu/Programs/Nativefier/nativefier.xml")) {
                    fs.readFile(process.env.APPDATA + "/Microsoft/Windows/Start Menu/Programs/Nativefier/nativefier.xml", 'utf8', function (err, data) {
                        if (err) {
                            return console.log(err);
                        }
                        var parser = new xml2js.Parser();
                        parser.parseString(data, function (err, result) {
                            if (err) {
                                return console.log(err);
                            }
                            processSnowyDuneXML(result, config["win32"]["name"], options["name"], exepath);
                        });
                    });
                } else {
                    processSnowyDuneXML({"Shortcuts": {"Shortcut": []}}, config["win32"]["name"], options["name"], exepath);
                }
            }
        });
    } else {
        console.log(argapp + " is for nativefier-install version " + config["version"] + ", not version " + currentapi + ".");
    }
});
