var settings = require("./config/settings");

var dbMaster = require("./app/dao/dbMaster");
dbMaster.Init(settings.db);


function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
            + " " + date.getHours() + seperator2 + date.getMinutes()
            + seperator2 + date.getSeconds();
    return currentdate;
}

var exp = require("./export/export");
var fs = require("fs");
var fileName = "./sell.csv";
setTimeout(function(){
	exp.QueryOrder((err, result)=>{

		var str = "";
		var srcs = ["id", "userid", "wxid", "cost", "count","date"];
		for(var i=0; i<srcs.length; i++)
		{
			str += srcs[i] +"\t";
		}
		str +="\n"
		for(var i=0,len=result.length;i<len; i++)
		{
			for(var j=0; j<srcs.length; j++)
			{
				str +=result[i][srcs[j]] +"\t";
			}
			str +="\n";
		}

		console.log(str);

		fs.writeFile("./" + getNowFormatDate()+".csv", str,()=>{});
	})
}, 1000);

