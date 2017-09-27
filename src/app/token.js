import crypto from 'crypto'
/**
 * Create token by uid. Encrypt uid and timestamp to get a token.
 * 
 * @param  {String} uid user id
 * @param  {String|Number} timestamp
 * @param  {String} pwd encrypt password
 * @return {String}     token string
 */
module.exports.create = function(sid, uid, timestamp, pwd) {
	var msg = sid + '&'+uid + '|' + timestamp;
	var cipher = crypto.createCipher('aes256', pwd);
	var enc = cipher.update(msg, 'utf8', 'hex');
	enc += cipher.final('hex');
	return enc;
};

/**
 * Parse token to validate it and get the uid and timestamp.
 * 
 * @param  {String} token token string
 * @param  {String} pwd   decrypt password
 * @return {Object}  uid and timestamp that exported from token. null for illegal token.     
 */
module.exports.parse = function(token, pwd) {
	var decipher = crypto.createDecipher('aes256', pwd);
	var dec;
	try {
		dec = decipher.update(token, 'hex', 'utf8');
		dec += decipher.final('utf8');
	} catch(err) {
		console.error('[token] fail to decrypt token. %j', token);
		return null;
	}
	var ts = dec.split('|');
	if(ts.length !== 2) {
		// illegal token
		return null;
	}
	var dt = ts[0].split("&");
	if(dt.length !== 2)
	{
		return null;
	}
	return {sid: dt[0],uid: dt[1], timestamp: Number(ts[1])};
};
