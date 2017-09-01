const server = {
	ip: "",
	port: 3000,
	gameType: "sg",
	baseToken: "agarxhqb123pajloads4ga8xrunpagkjwlaw456xnpcagl29w4rxn",
	version: 'v1',
	payUrl: "http://127.0.0.1:8718/paynotify"//"http://120.76.182.17:8080/paynotify"
}


const db = {
	"host": "localhost",
	"database": "majiang"
}

const redis = {
	redisUrl: 'redis://localhost:6379/0',
}

const wechat = {
	token: 'yJToEIfucCJOUIdLzSUUaf0zNL',
	encodingAESKey: 'qCzYzi7fDdak4dk3wOluH4dy6EaysIYSGnDs2dBBgem',
	corpId: 'wxcf0528b62d7cd09e',
	secret: 'loTkQJ7MTqWYypAwtdi-O1Kf-Dqf_VwFpCAvvjeKpcnlb6kgpunMUfbCtvn_VYBm',
	appID: 'wxcf0528b62d7cd09e',
	key: '89ecv2edcg69f6a2d062t5b4c03s024S',
	mchID: '1430855702',
	cb: "http://120.76.182.17/" + server.version + "/wxnotify",
	agentid: 2
}

//订阅号相关信息
const dyh = {
	key: "89ecv2edcg69f6a2d062t5b4c03s14S0",
	mchID: "1433459502",
	appID: "wxfe1105bf0e4beb05",
	token: 'yJToEIfucCJOUIdLzSUUaf0zNL',
	encodingAESKey: 'qCzYzi7fDdak4dk3wOluH4dy6EaysIYSGnDs2dBBgem',
	secret: "be3e1771f937feed5b72bcc9a45f97f2",
	cb: "http://120.76.182.17/dyh/" + server.version + "/wxnotify",
}
const dyhProduct = {
	15: {
		body: "充值5钻石",
		attach: "充值",
		fee: 1500,
		count: 5
	},
	30: {
		body: "充值10钻石",
		attach: "充值",
		fee: 3000,
		count: 10
	},
	150: {
		body: "充值50钻石",
		attach: "充值",
		fee: 15000,
		count: 50
	}
};
const product = {
	1: {
		body: "充值",
		attach: "充值",
		fee: 12000,
		count: 100
	},
	200: {
		body: "充值200钻石",
		attach: "充值",
		fee: 23800,
		count: 200
	},
	500: {
		body: "充值500钻石",
		attach: "充值",
		fee: 58800,
		count: 500
	},
	1000: {
		body: "充值1000钻石",
		attach: "充值",
		fee: 115000,
		count: 1000
	},
	2000: {
		body: "充值2000钻石",
		attach: "充值",
		fee: 223800,
		count: 2000
	},
};


// const log = {
// 	appender: {
// 		file: {
// 			type: 'file',
// 			filename: "logs/log.log",
// 			maxLogSize: 10 * 1024 * 1024, // = 10Mb
// 			numBackups: 5,// keep five backup files
// 			// layout: {
// 			// 	type: "basic"
// 			// }
// 		},
// 		// out: {
// 		// 	type: 'console'
// 		// }
// 	},
// 	categories: {
// 		default: { appenders: ['file',  'out'], level: 'info' }
// 	}
// }


const log = {
  appenders: [
    { type: 'console' },
    {
		type: "file",
		filename: "logs/log.log",
		maxLogSize: 1048576,
		// layout: {
		// 	type: "basic"
		// },
		backups: 5,
		// category: "app"
    }],
  	levels: {
	   app: "WARN"
	},
	replaceConsole: true,
}


module.exports = {
	server,
	db,
	wechat,
	product,
	log,
	dyh,
	redis,
	dyhProduct
}