//
// OAuth
// Author Andrew Dodson
var crypto = require('crypto'),
	url = require('url'),
	querystring = require('querystring');

function merge(a,b){
	var x,r = {};
	if( typeof(a) === 'object' && typeof(b) === 'object' ){
		for(x in a){if(a.hasOwnProperty(x)){
			r[x] = a[x];
			if(x in b){
				r[x] = merge( a[x], b[x]);
			}
		}}
		for(x in b){if(b.hasOwnProperty(x)){
			if(!(x in a)){
				r[x] = b[x];
			}
		}}
	}
	else{
		r = b;
	}
	return r;
}

function hashString(key, str, encoding){
	var hmac = crypto.createHmac("sha1", key);
	hmac.update(str);
	return hmac.digest(encoding);
}

function encode(s){
	return encodeURIComponent(s).replace(/\!/g, "%21")
                 .replace(/\'/g, "%27")
                 .replace(/\(/g, "%28")
                 .replace(/\)/g, "%29")
                 .replace(/\*/g, "%2A");
}

module.exports = new (function(){
	this.sign =  function( uri, opts, consumer_secret, token_secret, nonce ){

		console.log(arguments);

		// Damage control
		if(!opts.oauth_consumer_key){
			console.error('OAuth requires opts.oauth_consumer_key');
		}

		// Seperate querystring from path
		var scheme = url.parse(uri),
			path = scheme.protocol + '//'+ scheme.hostname + scheme.pathname,
			qs = querystring.parse(scheme.query);

		// Create OAuth Properties
		var query = {
			oauth_nonce : nonce || parseInt(Math.random()*1e20,10).toString(16),
			oauth_timestamp : nonce || parseInt((new Date()).getTime()/1000,10),
			oauth_signature_method : 'HMAC-SHA1',
			oauth_version : '1.0'
		};

		// Merge opts and querystring
		query = merge( query, opts || {} );
		query = merge( query, qs || {} );

		// Sort in order of properties
		var keys = Object.keys(query);
		keys.sort();
		var params = [];

		keys.forEach(function(k){
			if(query[k]){
				params.push( k + "=" + encode(query[k]) );
			}
		});

		params = params.join('&');

		var http = ["GET", encode(path).replace(/\+/g," ").replace(/\%7E/g,'~'), encode(params).replace(/\+/g," ").replace(/\%7E/g,'~') ];
		console.log(http.join('&'));
		console.log(consumer_secret+'&'+(token_secret||''));

		// Create oauth_signature
		query.oauth_signature = hashString( 
			consumer_secret+'&'+(token_secret||''), 
			http.join('&'),
			"base64"
		);

		return path + '?' + params +'&oauth_signature='+encode( query.oauth_signature );
	};
});