function printf(info, error) {
    var sel = $("#alert");
    sel.removeClass("alert-danger");
    sel.removeClass("alert-success");
    if (error)
        sel.addClass("alert-danger");
    else sel.addClass("alert-success");
    $("#alert").html("<strong>" + info + "</strong>");
}
//printf("hello", true);
function clearPage() {
    $("body").empty();
    $("body").html('<div class="alert alert-danger" role="alert"><strong>访问失败！请稍后再试</strong></div>');
}

function SetHead(cards)
{
    $("#txt_top").html("欢迎！您的钻石剩余：" +cards);
}
var globe = {};
var _v = 0;
function callAPi(api, params, cb) {

    params = params || {};
    params["_v"] = _v;
    _v++;
    $.ajax({
        url: "http://192.168.0.107/api/wechat/v1/" + api,

        // The name of the callback parameter, as specified by the YQL service
        // jsonp: "callback",

        // Tell jQuery we're expecting JSONP
        // dataType: "jsonp",

        // Tell YQL what we want and that we want JSON
        data: params,

        // Work with the response
        success: function(response) {
            //printf(JSON.stringify(response));
            cb(response);
        }
    });
}
function CallWXAPI(params) {
    function onBridgeReady() {
        WeixinJSBridge.invoke(
            'getBrandWCPayRequest', params,
            function(res) {
                var obj = {
                    id:globe.id,
                    key:globe.key
                };
                callAPi("getcard", obj, function(ret) {
                    if(ret.code == 200)
                        SetHead(ret.cards);
                });
            }
        );
    }
    if (typeof WeixinJSBridge == "undefined") {
        if (document.addEventListener) {
            document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
        } else if (document.attachEvent) {
            document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
            document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
        }
    } else {
        onBridgeReady();
    }
}

function isWeiXin() {
    var ua = window.navigator.userAgent.toLowerCase();
    if (ua.match(/MicroMessenger/i) == 'micromessenger') {
        return true;
    } else {
        return false;
    }
}


if(!isWeiXin())
{
    clearPage();
}
else
{
    var urlParams;
    (window.onpopstate = function() {
        var match,
            pl = /\+/g,
            search = /([^&=]+)=?([^&]*)/g,
            decode = function(s) {
                return decodeURIComponent(s.replace(pl, " "));
            },
            query = window.location.search.substring(1);
        urlParams = {};
        while (match = search.exec(query))
            urlParams[decode(match[1])] = decode(match[2]);
    })();

    //printf(urlParams)
    if (urlParams.code) {
        callAPi("login", urlParams, function(ret) {
            if (ret.code == 200) {
                globe = ret;
                SetHead(ret.cards);
                InitAPI();
            } else {
                clearPage();
            }
        });
    }
    Date.prototype.Format = function (fmt) { //author: meizz 
        var o = {           
    "M+" : this.getMonth()+1, //月份           
    "d+" : this.getDate(), //日           
    "h+" : this.getHours()%12 == 0 ? 12 : this.getHours()%12, //小时           
    "H+" : this.getHours(), //小时           
    "m+" : this.getMinutes(), //分           
    "s+" : this.getSeconds(), //秒           
    "q+" : Math.floor((this.getMonth()+3)/3), //季度           
    "S" : this.getMilliseconds() //毫秒           
    };  
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
} 
    var maxpage = 1;
    var curPage = 1;
    function emptyTable()
    {
        $("#table td").remove();
    }
    function AddItem(item){
        var newRow = "<tr>";
        newRow += "<td>" +(""+item.id)+ "</td>";
        newRow += "<td>" +item.pid+"("+item.name+")"+ "</td>";
        newRow += "<td>" +item.count+ "</td>";
        newRow += "<td>" +new Date(item.date).Format("yy/MM/dd HH:mm:ss");+ "</td>";
        newRow+ "</tr>";
        $("#table tr:last").after(newRow);
    }

    function AddListItem(val)
    {
       $("#page").append("<option>"+val+"</option>");
    }

    function solve( ret)
    {
        var max = Math.floor((ret.count + 9)/10);
        if(max >maxpage)
        {
            for(var i=maxpage+1;i <= max; i++)
            {
                AddListItem(i);
            }
            maxpage=max;
        }
        emptyTable();
        for(var i=0; i<ret.data.length; i++)
        {
            AddItem(ret.data[i]);
        }
        if(ret.count == 0)
        {
            $("#table tbody").html("未查询到订单！");
        }
    }
    function CallData(pg){
        var obj ={
            id: globe.id,
            key: globe.key,
            page: Number(pg)-1
        }
        callAPi("sellhistory", obj, function(ret){
            if(ret.code == 200)
            {
                //$("#table tbody").html(JSON.stringify(ret));
                solve(ret);
            }
            else{
                clearPage();
            }
        });
        
    }
    function InitAPI()
    {
        $("#page").change(function(val){
            var pg = $("#page").val();
            if(pg == curPage)
                return;
            curPage = pg;
            CallData(pg);
        })
        CallData(1);
    }
}
