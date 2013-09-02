var fs = require('fs');


var postProcess = function(filePath) {
	fs.readFile(filePath, 'utf8', function (err,data) {
	  if (err) {
		return console.log(err);
	  }
	 
	  var removeDev = /<!--DEV_START-->[\s\S]*(?=<!--DEV_END-->)<!--DEV_END-->/;
	  data = data.replace(removeDev, ''); // Dev

	  var removeBuildStart = /<!--BUILD_START/;
	  data = data.replace(removeBuildStart, ''); // Dev
	  var removeBuildEnd = /BUILD_END-->/;
	  data = data.replace(removeBuildEnd, ''); // Dev

	  var removeComments = /<!--[\s\S]*?(?=-->)-->/g; // regex for removing HTML comments
	  data = data.replace(removeComments, ''); // remove all html tags
	  //console.log(clean);
	  //console.log(data);
	  
	  fs.writeFile(filePath, data, function (err) {
		  if (err) {
			return console.log(err);
		  }
		});
	});
};

postProcess( __dirname + '/output/index.html' );
postProcess( __dirname + '/output/help.html' );
