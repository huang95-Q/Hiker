$.exports = {
    getHead: function (title, color) {
        if (!color) {
            color = "#FF4500";
        }
        return '‘‘’’<strong><font color="' + color + '">' + title + '</front></strong>';
    },
    getBanner: function (d, arr, start, cfg) {
        let Task_id = 'ximalaya';
        let time = 5000;
        let rnum = Math.floor(Math.random() * arr.length);
        let item = arr[rnum];
        putMyVar('xmly_run_num', rnum);
        let col_type = 'card_pic_1';
        let desc = '0'; //"card_pic_1"需要设置desc属性值(模糊度)
        if (cfg != undefined) {
            time = cfg.time ? cfg.time : time;
            col_type = cfg.col_type ? cfg.col_type : col_type;
            desc = cfg.desc ? cfg.desc : desc;
        }
        d.push({
            col_type: col_type,
            img: item.img,
            desc: desc,
            title: item.title ? item.title : '',
            url: item.url,
            extra: {
                id: 'banner',
            }
        })

        if (start == false) {
            unRegisterTask(id)
            return
        }

        registerTask(Task_id, time, $.toString((arr) => {
            let rum = getMyVar('xmly_run_num');
            let i = Number(getMyVar('banneri', '0'));
            if (rum != '') {
                i = Number(rum) + 1;
                clearMyVar('xmly_run_num');
            } else {
                i++;
            }
            if (i > (arr.length - 1)) {
                i = 0;
            }
            let item = arr[i];
            //log(item)
            try {
                updateItem('banner', {
                    title: item.title ? item.title : '',
                    img: item.img,
                    url: item.url,
                    extra: {
                        pageTitle: item.title ? item.title : '',
                    }
                })
            } catch (e) {
                log(e.message)
                unRegisterTask('ximalaya')
            }
            putMyVar('banneri', i);
        }, arr))
    },
    generateUUID: function () {
        var d = new Date().getTime(); //获取当前时间戳
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    },
    getHeaders: function () {
        function convertJSONToCookie(jsonData) {
            var cookie = '';
            for (var key in jsonData) {
                cookie += key + '=' + jsonData[key] + '; ';
            }
            return cookie.slice(0, -2);
        }
        //device_model=SM-G6100 (dd1f29a9-ac6c-343e-a0e9-40c0e9ebe3c6);
        let token = "";
        if (getItem("xmly_uid", "") && getItem("xmly_token", "")) {
            token = getItem("xmly_uid", "") + "&" + getItem("xmly_token", "");
        }

        let public_cookie = {
            //"1&_device": "android&fe7cb79f-66d2-4a81-93f9-7899b1e2e0fc&9.1.30",
            "1&_device": "android&" + getItem("my_uuid", "") + "&9.1.30",
            "1&_token": token,
            "channel": "and-d10",
            "impl": "com.ximalaya.ting.android",
            "osversion": "31",
            "device_model": "",
            "c-oper": "",
            "net-mode": "WIFI",
            "res": "",
            "AID": "",
            "manufacturer": "",
            "XD": "",
            "umid": "",
            "xm_grade": "1000",
        }
        let public_headers = {
            "User-Agent": "ting_9.1.30",
            "cookie": convertJSONToCookie(public_cookie),
            "cookie2": "$version=1"
        }
        return public_headers;
    },
    getFetchData: function (url, headers) {
        let fdata = JSON.parse(fetch(url, {
            headers: headers
        }));
        return fdata
    },
    postFetchData: function (url, headers, body) {
        let fdata = JSON.parse(fetch(url, {
            headers: headers,
            body: body,
            method: "post"
        }));
        return fdata
    },
    formatNumber: function (num) {
        if (num >= 10000) {
            num = (num / 10000).toFixed(1) + '万';
        }
        return num;
    },
    jsonToParamStr: function (json) {
        let paramsArr = [];
        for (let key in json) {
            paramsArr.push(`${key}=${encodeURIComponent(json[key])}`);
        }

        return paramsArr.join("&");
    },
    dateFormat: function (date, fmt) { // date为Date类型，fmt为字符串类型，表示格式化的日期格式
        const timeInfo = {
            "y+": date.getFullYear(), // 年份
            "M+": date.getMonth() + 1, // 月份
            "d+": date.getDate(), // 日
            "h+": date.getHours(), // 小时
            "m+": date.getMinutes(), // 分
            "s+": date.getSeconds(), // 秒
            "S+": date.getMilliseconds(), // 毫秒
            "q+": Math.floor((date.getMonth() + 3) / 3) // 季度
        };
        if (/(y+)/.test(fmt)) {    
            fmt = fmt.replace(RegExp.$1, date.getFullYear().toString().substr(4 - Math.min(4, RegExp.$1.length)));
        }
        for (let key in timeInfo) {
            let pattern = new RegExp("(" + key + ")");
            if (pattern.test(fmt)) {
                let value = timeInfo[key].toString();
                fmt = fmt.replace(pattern, RegExp.$1.length === 1 ? value : ("00" + value).substr(value.length));
            }
        }
        return fmt;
    },
    setTab: function (tabs) {
        tabs.forEach((tab, i) => {
            let tabname = tab.name;
            d.push({
                title: getMyVar('tabnum', '0') == i ? getHead(tabname) : tabname,
                url: $("#noLoading#").lazyRule((rank_Tabs, rankLists, i) => {
                    updateItem("rank_Tabs_id" + getMyVar("tabnum", "0"), {
                        title: rank_Tabs[parseInt(getMyVar("tabnum", "0"))].name
                    });
                    //log(tabname)
                    updateItem("rank_Tabs_id" + i, {
                        title: getHead(tabname)
                    });
                    let d = [];

                    putMyVar("tabnum", i);
                    //return 'toast://切换成功!'
                    return "hiker://empty"
                }, rank_Tabs, rankLists, i),
                col_type: "text_3",
                extra: {
                    id: "rank_Tabs_id" + i
                }
            });
        })
    },
}
