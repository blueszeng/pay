var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

function CreateDBManager(){
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
		// yay!
		console.log("db connection sucess!");
	});
	
	console.log("db connection start!");
	
	// connect to host


	return {
		Init: function(DBConfig)
		{
			mongoose.Promise = global.Promise;
			var connection = mongoose.createConnection('mongodb://'+ DBConfig.host + '/' + DBConfig.database);
			autoIncrement.initialize(connection);
		}
	};
}


module.exports = CreateDBManager();