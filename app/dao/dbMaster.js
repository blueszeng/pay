import mongoose from 'mongoose'
import autoIncrement from 'mongoose-auto-increment'
let logger = require('log4js').getLogger(`${__dirname}/${__filename}`)

function CreateDBManager(){
	let db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
		// yay!
		logger.warn("db connection sucess!");
	});
	
	logger.info("db connection start!");
	
	// connect to host


	return {
		Init: function(DBConfig)
		{
			mongoose.Promise = global.Promise;
			let connection = mongoose.createConnection('mongodb://'+ DBConfig.host + '/' + DBConfig.database);
			autoIncrement.initialize(connection);
		}
	};
}


export default CreateDBManager();