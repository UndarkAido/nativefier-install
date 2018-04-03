const fs = require('fs');
const xml2js = require('xml2js');
const util = require('util');

function processXML(xml){
    var contains = false;
    contains = true
    xml["Shortcuts"]["Shortcut"].forEach(function(shortcut){
	if(shortcut["Id"][0] == "googlecalendar"){
	    contains = true;
	}
    });
    if(!contains){
	xml["Shortcuts"]["shortcut"].push({
	    Name: [ 'Google Calendar' ],
	    Id: [ 'googlecalendar' ],
	    Path: [ 'C:\\Users\\Aidan\\AppData\\Roaming\\Nativefier\\GoogleCalendar-win32-x64\\GoogleCalendar.exe' ],
	    Arguments: [ '' ],
	    RunAsAdmin: [ 'false' ],
	    SingleInstance: [ 'false' ]
	});
    }
    var builder = new xml2js.Builder();
    var built = builder.buildObject(xml);
    fs.writeFile(process.env.APPDATA + "/Microsoft/Windows/Start Menu/Programs/Nativefier/nativefier.xml", built, function(err) {
	if(err) {
            return console.log(err);
	}
    });
}

if (fs.existsSync(process.env.APPDATA + "/Microsoft/Windows/Start Menu/Programs/Nativefier/shortcuts.xml")) {
    fs.readFile(process.env.APPDATA + "/Microsoft/Windows/Start Menu/Programs/Nativefier/shortcuts.xml", 'utf8', function (err,data) {
	if (err) {
	    return console.log(err);
	}
	var parser = new xml2js.Parser();
	parser.parseString(data, function (err, result) {
	    if (err) {
		return console.log(err);
	    }
	    processXML(result);
	});
    });
}else{
    processXML({"Shortcuts": {Shortcut: []}});
}
