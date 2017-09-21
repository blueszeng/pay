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
        url: "http://101.132.96.27:4000/api/wechat/v1/" + api,

        // The name of the callback parameter, as specified by the YQL service
        jsonp: "callback",

        // Tell jQuery we're expecting JSONP
        dataType: "jsonp",

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


// if(!isWeiXin())
// {
//     clearPage();
// }
// else
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
    var passName = {

    };

    function InitAPI() {

        $("#playerid").blur(function(){
            var val = $("#playerid").val();
            if(val.length != 5)
            {
                 $("#txt_name").html("无效的玩家ID");
                 return;
            }
            var obj = {
                uid: val,
                id: globe.id,
                key: globe.key
            }
            $("#txt_name").html("");
            callAPi("getusername", obj, function(ret){
                if(ret.code == 200)
                {
                    passName[val] = ret.name;
                     $("#txt_name").html(ret.name);
                }
                else{
                     $("#txt_name").html("无效的玩家ID");
                }
            });
        });

        var lock = false;
        $("#charge").click(function() {
            var id = $("#playerid").val();
            if(passName[id] === undefined)
            {
                printf("等待验证或者无效玩家ID",true);
                return;
            }
            var num = $("#cards").val();
            if(num<0||num>2000)
            {
                printf("额度超出范围",true);
                return;
            }
            var obj = {
                uid: id,
                num: num,
                id: globe.id,
                key: globe.key
            }
            $("#charge").attr("disabled",true); 
            lock = true;
            callAPi("sell", obj, function(ret) {
                lock = false;
                $("#charge").attr("disabled",false); 
                if (ret.code == 200) {
                    SetHead(ret.cards);
                    printf("充值成功");
                } else {
                    printf("申请订单失败,请稍后再试!", true);
                }
            });
        })
    }
}
