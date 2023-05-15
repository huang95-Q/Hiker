//开始
const xmlyPages = {
    ruleFilePath: {
        configPath: 'hiker://files/rules/xmly/config.json',
        xmlyPagesPath: 'hiker://files/rules/xmly/xmlyPages.js',
        publicFunctionPath: 'hiker://files/rules/xmly/publicFunction.js'
    },
    update: function () {
        function cacheFile(fileName, remotePath, isRequire, isSave, encrypt) {
            if (remotePath.startsWith("http")) {
                remotePath = remotePath.match(/:\/\/[^\/]*\/(.*)/)[1];
            }
            let proxy_urls = ["https://raw.iqiq.io/", "https://ghproxy.net/https://raw.githubusercontent.com/", "https://ghproxy.com/https://raw.githubusercontent.com/"];
            for (let i = 0; i < proxy_urls.length; i++) {
                try {
                    let file_content;
                    if (isRequire) {
                        file_content = require(proxy_urls[i] + remotePath);
                    } else {
                        file_content = fetch(proxy_urls[i] + remotePath);
                    }
                    if (file_content) {
                        if (isSave) {
                            if (encrypt) {
                                saveFile(fileName, file_content);
                            } else {
                                saveFile(fileName, file_content, 0);
                            }
                        }
                        break;
                    }
                } catch (e) {
                    log(e.toString());
                }
            }
            return file_content;
        }
        let localConfig = JSON.parse(fetch(this.ruleFilePath.configPath));
        let remoteConfig = JSON.parse(cacheFile(localConfig.config.hikerPath, localConfig.config.remotePath, false));
        const func_version = getItem('xmly_publicFunction_version');
        const pages_version = getItem('xmly_xmlyPages_version');
        if (func_version != remoteConfig.publicFunction.version) {
            cacheFile(localConfig.publicFunction.hikerPath, localConfig.publicFunction.remotePath, false, true);
        }
        if (pages_version != remoteConfig.xmlyPages.version) {
            confirm({
                title: '更新来啦',
                content: (pages_version || 'N/A') + '=>' + remoteConfig.xmlyPages.version + '\n修复已知bug，优化代码',
                confirm: $.toString((cacheFile) => {
                    cacheFile(localConfig.xmlyPages.hikerPath, localConfig.xmlyPages.remotePath, false, true);
                }, cacheFile),
                cancel: ''
            })
        }
        if (func_version != remoteConfig.publicFunction.version || pages_version != remoteConfig.xmlyPages.version) {
            deleteCache();
            cacheFile(localConfig.config.hikerPath, localConfig.config.remotePath, true, true);
            refreshPage();
        }
        return;
    },
    preRule: function () {
        let localConfig = JSON.parse(fetch(this.ruleFilePath.configPath));
        if (!getItem('xmly_publicFunction_version')) {
            setItem('xmly_publicFunction_version', localConfig.publicFunction.version);
        }
        if (!getItem('xmly_xmlyPages_version')) {
            setItem('xmly_xmlyPages_version', localConfig.xmlyPages.version);
        }
        this.update();
        return;
    },
    homePage: function () {
        addListener('onClose', () => {
            unRegisterTask('ximalaya');
        });
        var d = [];
        var page = MY_PAGE;
        var {
            getHead,
            getBanner,
            generateUUID,
            getHeaders,
            getFetchData,
            postFetchData,
            formatNumber,
            jsonToParamStr
        } = $.require("hiker://page/publicFunction");
        //模拟生成设备唯一标识uuid
        if (getItem("my_uuid", "") == "") {
            var my_uuid = generateUUID();
            setItem("my_uuid", my_uuid)
        }
        //setItem("my_uuid", "580d8adf-c7e1-34d3-9dc8-669b26507782")
        var public_headers = getHeaders();
        //log(getItem("my_uuid"));
        if (getItem("addresscode", "") == "") {
            let code_url = "https://mobile.ximalaya.com/mobile/discovery/v2/location";
            let code_data = getFetchData(code_url, public_headers);
            let addresscode = code_data.countryCode + '_' + code_data.provinceCode + '_' + code_data.cityCode;
            setItem("addresscode", addresscode)
        }
        if (page == 1) {
            let Bottom_nav_bar = [{
                "title": "首页",
                "selected_icon": "https://lanmeiguojiang.com/tubiao/system/130.png",
                "no_selected_icon": "https://lanmeiguojiang.com/tubiao/system/129.png",
                "url": "hiker://page/homePage"
            },
            {
                "title": "会员",
                "selected_icon": "https://lanmeiguojiang.com/tubiao/system/148.png",
                "no_selected_icon": "https://lanmeiguojiang.com/tubiao/system/147.png",
                "url": "hiker://page/vipPage"
            },
            {
                "title": "关注",
                "selected_icon": "https://lanmeiguojiang.com/tubiao/system/132.png",
                "no_selected_icon": "https://lanmeiguojiang.com/tubiao/system/131.png",
                "url": "hiker://page/focusPage"
            },
            {
                "title": "我的",
                "selected_icon": "https://lanmeiguojiang.com/tubiao/system/139.png",
                "no_selected_icon": "https://lanmeiguojiang.com/tubiao/system/137.png",
                "url": "hiker://page/myPage"
            }]
            Bottom_nav_bar.forEach((tab, i) => {
                let tabname = "";
                let icon_url = "";
                if (getMyVar('Bnbnum', '0') == i) {
                    tabname = getHead(tab.title);
                    icon_url = tab.selected_icon;
                } else {
                    tabname = tab.title;
                    icon_url = tab.no_selected_icon;
                }
                d.push({
                    title: tabname,
                    url: $('hiker://empty#noLoading##noHistory#').lazyRule((i) => {
                        putMyVar("Bnbnum", i);
                        refreshPage();
                        return 'hiker://empty'
                    }, i),
                    pic_url: icon_url,
                    col_type: "icon_small_4"
                });
            })
        }
        if (getMyVar('Bnbnum', '0') == 0) {
            //首页
            let ts = new Date().getTime();
            if (page == 1) {
                //首页一级分类
                let discategory_url = "https://mobile.ximalaya.com/discovery-category/customCategories/" + ts + "?channel=and-d10&code=&countyCode=0&device=android&needVip=false&version=9.1.30";
                let discategory_data = getFetchData(discategory_url, public_headers);
                let customCategoryList = discategory_data.customCategoryList;
                //log(customCategoryList)
                customCategoryList.forEach((cate, i) => {
                    let title = cate.title;
                    d.push({
                        title: getMyVar('customCategoriesnum', '1') == i ? getHead(title) : title,
                        col_type: 'scroll_button',
                        url: $('hiker://empty#noLoading#').lazyRule((id, i) => {
                            putMyVar('customCategoriesnum', i);
                            putMyVar("customCategoryListValue", id)
                            refreshPage(false);
                            return 'hiker://empty'
                        }, cate.id, i),
                    });
                })
            }
            //首页一级分类和数据
            if (getMyVar("customCategoryListValue", "recommend") == "recommend") {
                //推荐
                let discategory_param = {
                    "code": getItem("addresscode", ""),
                    "offset": "0",
                    "vertical_stream": "1",
                    "giftTag": "0",
                    "scale": "1",
                    "onlyBody": "false",
                    "version": "9.1.30",
                    "deviceId": getItem("my_uuid"),
                    "click": "false",
                    "hotPlayModuleShowTimes": "1",
                    "operator": "3",
                    "network": "",
                    "screenId": "",
                    "countyCode": "0",
                    "guessPageId": getItem("guessPageId", "0"),
                    "appid": "0",
                    "topBuzzVersion": "3",
                    "device": "android",
                    "firstInstall": "2",
                    "categoryId": "-2"
                }
                //let disfeed_url = "https://mobile.ximalaya.com/discovery-feed/v4/mix/ts-" + ts + "?appid=0&categoryId=-2&channel=and-d10&code=43_530000_5306&device=android&deviceId=XAAoChdFshZsrVCsmkOk0-LfJxJFWSpqL7C&network=wifi&operator=2&scale=1&screenId=6bdee33010bc72e17946e9eda6ae3b81&version=9.1.35&xt=1683952425681";
                let disfeed_url = "https://mobile.ximalaya.com/discovery-feed/v3/mix/ts-" + ts;
                if (page == 1) {
                    let disfeed_data = postFetchData(disfeed_url, public_headers, jsonToParamStr(discategory_param));
                    //log(disfeed_data)
                    //分类
                    let disfeed_header = disfeed_data.header;
                    let disfeed_body = disfeed_data.body;
                    let discate, disdata;
                    //log(disfeed_header)
                    for (let i = 0; i < disfeed_header.length; i++) {
                        if (disfeed_header[i].hasOwnProperty('extInfo')) {
                            discate = disfeed_header[i].item;
                            if (disfeed_header[i + 1]) {
                                disdata = disfeed_header[i + 1].item;
                            }
                        } else {
                            discate = disfeed_header[i + 1].item;
                            disdata = disfeed_header[i].item;
                        }
                        break
                    }
                    discate.list.forEach((cate, i) => {
                        let title = cate.title;
                        let url = "hiker://empty##首页推荐一级分类详情?page=fypage#noRecordHistory#";
                        if (i == (discate.list.length - 1)) {
                            url = "hiker://empty##首页推荐更多分类#noRecordHistory#"
                        }
                        d.push({
                            title: title,
                            url: $('hiker://empty##detailPage').rule((url, cate_url) => {
                                eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                if (/详情/.test(url)) {
                                    xmlyPages.homeRecFirstCateDetailPage();
                                } else {
                                    xmlyPages.homeMoreRecommendCatePage();
                                }
                            }, url, cate.url),
                            pic_url: cate.coverPath + "@Referer=",
                            col_type: "icon_5"
                        });
                    })
                    //专属推荐
                    //log(disdata)
                    if (disdata) {
                        if (disdata.moduleType == "focus") {
                            let bannersLists = disdata.list[0].data;
                            let banner_Arr = bannersLists.map(it => {
                                if (!it.isAd) {
                                    return {
                                        title: "",
                                        img: it.cover,
                                        url: $('hiker://empty##detailPage').rule((realLink) => {
                                            eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                            //xmlyPages.detailPage();
                                        }, it.realLink)
                                    };
                                }
                            })
                            //log(banner_Arr)
                            getBanner(d, banner_Arr, true, {
                                col_type: 'card_pic_1',
                                desc: '0',
                                time: 5000
                            })
                        } else {
                            d.push({
                                title: disdata.title,
                                desc: '查看全部 >',
                                pic_url: "https://lanmeiguojiang.com/tubiao/system/93.png",
                                url: $('hiker://empty##vipPage?page=fypage').rule(() => {
                                    eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                    //xmlyPages.detailPage();
                                }),
                                col_type: "avatar",
                                extra: {
                                    pageTitle: "会员频道页"
                                }
                            });
                            disdata.list.forEach((data, i) => {
                                d.push({
                                    title: data.title,
                                    desc: "主播: " + data.anchor.nickName,
                                    url: $('hiker://empty##detailPage').rule(() => {
                                        eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                        //xmlyPages.detailPage(albumId);
                                    }),
                                    pic_url: data.cover + "@Referer=",
                                    col_type: "movie_3_marquee"
                                });
                            });
                        }
                    }
                    d.push({
                        title: "猜你喜欢",
                        url: "hiker://empty",
                        col_type: "text_1"
                    })
                    disfeed_body.forEach((data, i) => {
                        if ((data.item.categoryId != 0) && (!data.item.hasOwnProperty("moduleType"))) {
                            d.push({
                                title: data.item.title,
                                desc: "主播: " + data.item.nickname,
                                url: $('hiker://empty##detailPage').rule(() => {
                                    eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                    //xmlyPages.detailPage(albumId);
                                }),
                                pic_url: data.item.coverPath + "@Referer=",
                                col_type: "movie_3_marquee"
                            });
                        }
                    });
                } else {
                    discategory_param.offset = "17";
                    discategory_param.onlyBody = "true";
                    let disfeed_data = postFetchData(disfeed_url, public_headers, jsonToParamStr(discategory_param));
                    //log(disfeed_data)
                    disfeed_data.body.forEach((data, i) => {
                        if ((data.item.categoryId != 0) && (!data.item.hasOwnProperty("moduleType"))) {
                            d.push({
                                title: data.item.title,
                                desc: "主播: " + data.item.nickname,
                                url: $('hiker://empty##detailPage').rule(() => {
                                    eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                    //xmlyPages.detailPage(albumId);
                                }),
                                pic_url: data.item.coverPath + "@Referer=",
                                col_type: "movie_3_marquee"
                            });
                        }
                    });
                }
            } else if (getMyVar("customCategoryListValue") == "lamia") {
                //直播
                let lamia_url = "http://livewsa.ximalaya.com/lamia/v17/live/homepage?categoryType=10000&pageId=" + page + "&pageSize=20&sign=2&timeToPreventCaching=" + ts;
                let lamia_data = getFetchData(lamia_url, public_headers);
                if (page == 1) {
                    let liveChannels = lamia_data.data.liveChannels;
                    liveChannels.forEach((channel, i) => {
                        let title = channel.name;
                        //let url = channel.jumpUrl;
                        let id = channel.id;
                        let url;
                        if (id == "10001") {
                            url = $('hiker://empty').lazyRule((jumpUrl) => {
                            }, channel.jumpUrl);
                        } else {
                            url = $('hiker://empty##homeLamiaFirstCateDetailPage?page=fypage').rule(() => {
                                eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                xmlyPages.homeLamiaFirstCateDetailPage();
                            });
                        }
                        d.push({
                            title: title,
                            url: url,
                            pic_url: channel.iconUrl + "@Referer=",
                            col_type: "icon_5"
                        });
                    });
                    d.push({
                        col_type: "line"
                    });
                    d.push({
                        title: "推荐直播",
                        pic_url: "https://lanmeiguojiang.com/tubiao/q/53.png",
                        url: "hiker://empty",
                        col_type: "avatar"
                    });
                    let lives = lamia_data.data.lives;
                    lives.slice(0, 10).forEach((data) => {
                        d.push({
                            title: data.name,
                            desc: data.labelName,
                            url: $('hiker://empty').lazyRule((playUrl) => {
                                //直播(一级页面点击直接播放)
                            }, data.playUrl),
                            pic_url: data.coverLarge + "@Referer=",
                            col_type: "movie_3_marquee"
                        });
                    });
                    let hotmodul = lamia_data.data.hotModule;
                    d.push({
                        title: hotmodul.cardName,
                        desc: '更多 >',
                        pic_url: "https://lanmeiguojiang.com/tubiao/q/53.png",
                        url: "hiker://empty",
                        col_type: "avatar",
                        extra: {
                            pageTitle: "直播"
                        }
                    });
                    hotmodul.halls.forEach((data) => {
                        d.push({
                            title: data.name,
                            desc: data.labelName,
                            url: $('hiker://empty').lazyRule((playUrl) => {
                            }, data.playUrl),
                            pic_url: data.avatar + "@Referer=",
                            col_type: "movie_3_marquee"
                        });
                    });
                    d.push({
                        title: "推荐直播",
                        pic_url: "https://lanmeiguojiang.com/tubiao/q/53.png",
                        url: "hiker://empty",
                        col_type: "avatar"
                    });
                    lives.slice(10, 20).forEach((data) => {
                        d.push({
                            title: data.name,
                            desc: data.labelName,
                            url: $('hiker://empty').lazyRule((playUrl) => {
                            }, data.playUrl),
                            pic_url: data.coverLarge + "@Referer=",
                            col_type: "movie_3_marquee"
                        });
                    });
                } else {
                    let lives = lamia_data.data.lives;
                    lives.forEach((data) => {
                        d.push({
                            title: data.name,
                            desc: data.labelName,
                            url: $('hiker://empty').lazyRule((playUrl) => {
                            }, data.playUrl),
                            pic_url: data.coverLarge + "@Referer=",
                            col_type: "movie_3_marquee"
                        });
                    });
                }
            } else {

            }
        } else if (getMyVar('Bnbnum', '0') == 1) {

        } else if (getMyVar('Bnbnum', '0') == 2) {

        } else {
            //我的页面
        }
        setResult(d)
    },
    searchPage: function () {
    },
    detailPage: function (params) {
    },
    homeRecFirstCateDetailPage: function () {
        //首页推荐分类详情页
        addListener('onClose', () => {
            unRegisterTask('ximalaya');
            removeWebProxyRule();
            clearMyVar("channelId");
            clearMyVar("showModules");
            clearMyVar("offset");
        })
        var d = [];
        let {
            getHead,
            getHeaders,
            getBanner,
            getFetchData,
            formatNumber,
        } = $.require("hiker://page/publicFunction");
        let cate_url = MY_PARAMS.cate_url;
        let page = getParam("page");
        //log(page)
        let msg_type = cate_url.match(/msg_type=(.*?)(&|$)/)[1];
        log(cate_url)
        log(msg_type)
        let headers = getHeaders();
        let ts = new Date().getTime();
        if (msg_type == 335) {
            //入站必听
            if (page == 1) {
                let cate_url = "https://mobile.ximalaya.com/discovery-ranking-web/newUser/ranking/queryAllRankType";
                let cate_data = getFetchData(cate_url, headers);
                let rdata = cate_data.data;
                d.push({
                    title: "🏆" + rdata.typeName,
                    url: "hiker://empty",
                    col_type: "text_center_1"
                });
                let rankingList = rdata.rankingList;
                rankingList.forEach((it, i) => {
                    d.push({
                        title: getMyVar('rankingListNum', '0') == i ? getHead(it.name) : it.name,
                        url: $('hiker://empty#noLoading#').lazyRule((id, i) => {
                            putMyVar("rankingListNum", i);
                            putMyVar("rankingListId", id);
                            refreshPage();
                            return 'hiker://empty'
                        }, it.id, i),
                        col_type: "scroll_button"
                    });
                });
            }
            let rankList_url = "https://mobile.ximalaya.com/discovery-ranking-web/newUser/ranking/singleRankList?pageId=" + page + "&pageSize=20&rankingListId=" + getMyVar("rankingListId", "0") + "&type=1";
            let rankList_data = getFetchData(rankList_url, headers);
            let rank_data_list = rankList_data.data.list;
            rank_data_list.forEach((list) => {
                d.push({
                    title: list.title,
                    url: $('hiker://empty##detailPage').rule((albumId) => {
                        eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                        xmlyPages.detailPage(albumId);
                    }, list.albumId),
                    col_type: "movie_1_left_pic",
                    desc: list.intro + "\n" + (list.isFinished == 2 ? "已完结\t\t🔥" : "🔥") + list.albumScore + "分",
                    pic_url: list.coverLarge
                });
            })
        } else if (msg_type == 336) {
            //排行榜
            if (page == 1) {
                let rank_cate1_url = 'https://mobile.ximalaya.com/discovery-ranking-web/v5/ranking/AggregateRankFirstPage/ts-' + ts;
                let rank_cate1_data = getFetchData(rank_cate1_url, headers);
                let rankCates1 = rank_cate1_data.data.tabs;
                putMyVar('rankingId', rankCates1[0].id);
                rankCates1.forEach((item, index) => {
                    d.push({
                        title: getMyVar('rank_index1', '0') == index ? getHead(item.name) : item.name,
                        col_type: 'scroll_button',
                        url: $('hiker://empty#noLoading#').lazyRule((id, index) => {
                            putMyVar('rank_index1', index);
                            putMyVar('rank_tabs_id', id);
                            refreshPage();
                            return 'hiker://empty'
                        }, item.id, index)
                    });
                });
                d.push({
                    col_type: 'blank_block'
                });
                let rank_cate2_url = 'https://mobile.ximalaya.com/discovery-ranking-web/v5/ranking/AggregateRankListTabs/ts-' + ts + '?tabId=' + getMyVar('rank_tabs_id');
                let rank_cate2_data = getFetchData(rank_cate2_url, headers);
                let rankCates2 = rank_cate2_data.data.wrapList;
                putMyVar('rankingId', rankCates2[0].rankingId);
                rankCates2.forEach((item, index) => {
                    d.push({
                        title: getMyVar('rank_index2', '0') == index ? getHead(item.name) : item.name,
                        col_type: 'scroll_button',
                        url: $('hiker://empty#noLoading#').lazyRule((rankingId, index) => {
                            putMyVar('rank_index2', index);
                            putMyVar('rankingId', rankingId);
                            refreshPage();
                            return 'hiker://empty'
                        }, item.rankingId, index)
                    });
                });
            }
            if (page <= getMyVar('maxPageId', '1')) {
                let rankingList_url = 'https://mobile.ximalaya.com/discovery-ranking-web/v5/ranking/concreteRankList/ts-' + ts + '?pageId=' + page + '&pageSize=20&rankingListId=' + getMyVar('rankingId');
                let rankingList_data = getFetchData(rankingList_url, headers);
                if (!getMyVar('maxPageId')) {
                    let maxPageId = rankingList_data.data.maxPageId;
                    putMyVar('maxPageId', maxPageId);
                }
                rankingList_data.data.list.forEach((list, i) => {
                    let positionChange = list.positionChange;
                    let positionEmoji = '➖'; //0
                    if (positionChange == 1) {
                        positionEmoji = '🔺';
                    } else if (positionChange == 2) {
                        positionEmoji = '🔹';
                    }
                    let title = list.title;
                    if (i == 0) {
                        title = '🥇' + title;
                    } else if (i == 0) {
                        title = '🥈' + title;
                    } else if (i == 0) {
                        title = '🥉' + title;
                    } else {
                        title = i + ' ' + title;
                    }
                    title = positionEmoji + title;
                    d.push({
                        title: title,
                        url: $('hiker://empty##detailPage').rule((albumId) => {
                            eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                            xmlyPages.detailPage(albumId);
                        }, list.albumId),
                        col_type: "movie_1_left_pic",
                        desc: '主播: ' + list.nickName + '\n' + list.intro + "\n" + (list.isFinished == 2 ? "已完结\t\t" : "更新至: " + list.lastTrackTitle),
                        pic_url: list.coverLarge,
                        extra: {
                            pageTitle: list.title
                        }
                    });
                });
            }
        } else if (msg_type == 94) {
            //小说，ASMR
            if (/rn_asmr/.test(cate_url)) {
                //asmr
                let reinfo_url = "https://mobile.ximalaya.com/discovery-feed/sleep/v9/recommend/info";
                let feed_url = "https://mobile.ximalaya.com/discovery-feed/sleep/v9/scene/list";
                let itemData = getFetchData(feed_url, headers);
                let reinfoData = getFetchData(reinfo_url, headers);
                let feedData = itemData.data;
                let infoData = reinfoData.data;
                d.push({
                    title: "我的收藏",
                    url: "hiker://collection?rule=" + MY_RULE.title,
                    col_type: "text_2"
                }, {
                    title: "历史记录",
                    url: "hiker://collection?rule=" + MY_RULE.title,
                    col_type: "text_2"
                });
                d.push({
                    title: infoData.mainTitle + '\n““””<small>' + infoData.recommendText + '</small>',
                    url: infoData.bgCover,
                    col_type: "card_pic_1",
                    desc: '0',
                    pic_url: infoData.bgCover
                });

                feedData.forEach((item, i) => {
                    if (i == 0) {
                        d.push({
                            title: item.sceneTitle,
                            url: $('hiker://empty').lazyRule((sceneId) => {
                            }, item.sceneId),
                            col_type: "avatar",
                            desc: "▶️",
                            pic_url: item.bgCover
                        });
                    } else {
                        d.push({
                            title: item.sceneTitle,
                            url: $('hiker://empty').lazyRule((sceneId) => {
                            }, item.sceneId),
                            col_type: "icon_2_round",
                            desc: item.sceneSubTitle,
                            pic_url: item.bgCover
                        });
                    }
                })

            } else {
                //小说类
                let categoryId = cate_url.split("=").slice(-1);
                if (page == 1) {
                    let feed_url = "https://mobile.ximalaya.com/discovery-category/newUser/category/feed/" + ts + "?categoryId=" + categoryId;
                    let itemData = getFetchData(feed_url, headers);
                    let itemList = itemData.itemList;
                    let showModules = itemData.showModules;
                    putMyVar("showModules", showModules);
                    itemList.forEach((item) => {
                        if (item.hasMore) {
                            putMyVar("offset", item.offset);
                        }
                        if (item.moduleType == 93) {
                            let tabList = item.list;
                            if (tabList.length > 8) {
                                tabList.slice(0, 7).forEach((tab, i) => {
                                    let uri = tab.properties.uri ? tab.properties.uri : tab.properties.rankClusterId;
                                    d.push({
                                        title: tab.title,
                                        url: $('hiker://empty##homeRecSecondCateDetailPage?page=fypage').rule((uri) => {
                                            eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                            //xmlyPages.homeRecSecondCateDetailPage();
                                        }, uri),
                                        col_type: "text_4",
                                        extra: {
                                            id: "tabList_id_" + i
                                        }
                                    });
                                })
                                let mArrTab = [];
                                tabList.slice(7).forEach((tab, i) => {
                                    let uri = tab.properties.uri ? tab.properties.uri : tab.properties.rankClusterId;
                                    mArrTab.push({
                                        title: tab.title,
                                        url: $('hiker://empty##homeRecSecondCateDetailPage?page=fypage').rule((uri) => {
                                            eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                            //xmlyPages.homeRecSecondCateDetailPage();
                                        }, uri),
                                        col_type: "text_4",
                                        extra: {
                                            cls: "tabList_id_cls"
                                        }
                                    });
                                })
                                d.push({
                                    title: "🔽",
                                    url: $('hiker://empty#noLoading#').lazyRule((mArrTab) => {
                                        if (getMyVar("tabList_down", "收起") == "收起") {
                                            addItemBefore('tabList_the_last_id', mArrTab);
                                            putMyVar("tabList_down", "展开");
                                        } else {
                                            deleteItemByCls("tabList_id_cls");
                                            putMyVar("tabList_down", "收起");
                                        }
                                        return "hiker://empty"
                                    }, mArrTab),
                                    col_type: "text_4",
                                    extra: {
                                        id: "tabList_the_last_id"
                                    }
                                });
                                d.push({
                                    col_type: "line"
                                });
                            } else {
                                tabList.forEach((tab, i) => {
                                    let uri = tab.properties.uri ? tab.properties.uri : tab.properties.rankClusterId;
                                    d.push({
                                        title: tab.title,
                                        url: $('hiker://empty##homeRecSecondCateDetailPage?page=fypage').rule((uri) => {
                                            eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                            //xmlyPages.homeRecSecondCateDetailPage();
                                        }, uri),
                                        col_type: "text_4"
                                    });
                                })
                            }
                        } else if (item.moduleType == 91) {
                            /*
                            let bannersLists = item.list;
                            let banner_Arr = bannersLists.map(it => {
                                return {
                                    title: it.title,                        
                                    img: it.coverMiddle,
                                    url: $('hiker://empty##detailPage').rule((realLink) => {
                                        eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                        xmlyPages.detailPage(realLink);
                                    }, it.realLink),
                                }
                            })
                            //log(banner_Arr)
                            getBanner(d, banner_Arr, true, {
                                col_type: 'card_pic_1',
                                desc: '0',
                                time: 5000
                            })*/
                            let item_colors = ["#F4A460", "#7E8F6B", "#4682B4"];
                            let colorNum = 0;
                            item.list.forEach((it) => {
                                /*
                                if(colorNum > 2){                           
                                    colorNum = 0;
                                }*/
                                //log(item_colors[colorNum])
                                let title = it.recIntro + "<br><small>" + it.tags + "</small>";
                                d.push({
                                    title: getHead(title, item_colors[1]).replace("‘‘’’", ""),
                                    col_type: "rich_text"
                                })
                                //colorNum++;
                                d.push({
                                    title: it.title,
                                    desc: "▶️",
                                    img: it.coverLarge,
                                    url: $('hiker://empty##detailPage').rule((albumId) => {
                                        eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                        //xmlyPages.detailPage(albumId);
                                    }, it.albumId),
                                    col_type: "avatar"
                                });
                                d.push({
                                    col_type: "line_blank"
                                });

                            })
                        } else {
                            item.list.forEach((list) => {
                                d.push({
                                    title: list.title,
                                    url: $('hiker://empty##detailPage').rule((albumId) => {
                                        eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                        xmlyPages.detailPage(albumId);
                                    }, list.albumId),
                                    col_type: "movie_1_left_pic",
                                    desc: list.intro + "\n" + (list.isFinished == 2 ? "已完结\t\t" : "更新至: " + list.lastTrackTitle),
                                    pic_url: list.coverLarge
                                });
                            })
                        }
                    })
                }
                let offset_url = "https://mobile.ximalaya.com/discovery-category/newUser/category/feed/" + ts + "?categoryId=" + categoryId + "&showModules=" + getMyVar("showModules") + "&offset=" + getMyVar("offset");

                if (getMyVar("offset") != 0) {
                    let more_data = getFetchData(offset_url, headers);
                    if (more_data.hasMore) {
                        putMyVar("offset", more_data.itemList[0].offset);
                        more_data.itemList[0].list.forEach((list) => {
                            d.push({
                                title: list.title,
                                url: $('hiker://empty##detailPage').rule((albumId) => {
                                    eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                    xmlyPages.detailPage(albumId);
                                }, list.albumId),
                                col_type: "movie_1_left_pic",
                                desc: list.intro + "\n" + (list.isFinished == 2 ? "已完结\t\t" : "更新至: " + list.lastTrackTitle),
                                pic_url: list.coverLarge
                            });
                        });
                    } else {
                        putMyVar("offset", 0);
                    }
                } else {
                    d.push({
                        title: "我们到底了~",
                        url: "hiker://empty",
                        col_type: "text_center_1"
                    });

                }
            }
        } else if (msg_type == 74) {
            //今日热点类
            let channelGroupId = cate_url.split("=").slice(-1);
            if (page == 1) {
                let group_url = "https://mobile.ximalaya.com/discovery-firstpage/headline/v2/queryGroupById/ts-" + ts + "?groupId=" + channelGroupId + "&sourceType=7";
                let group_data = getFetchData(group_url, headers).data;
                let group_u
                d.push({
                    title: group_data.name,
                    url: "hiker://empty",
                    pic_url: group_data.coverPath,
                    col_type: "text_center_1"
                });
                if (getMyVar("channelId", "") == "") {
                    putMyVar("channelId", group_data.radios[0].channelId);
                    putMyVar("radioId", group_data.radios[0].radioId);
                }
                group_data.radios.forEach((it, i) => {
                    d.push({
                        title: getMyVar('group_radiosNum', '0') == i ? getHead(it.name) : it.name,
                        url: $('hiker://empty#noLoading#').lazyRule((i, channelId, radioId) => {
                            putMyVar("group_radiosNum", i);
                            putMyVar("channelId", channelId);
                            putMyVar("radioId", radioId);
                            refreshPage();
                            return 'hiker://empty'
                        }, i, it.channelId, it.radioId),
                        col_type: "scroll_button"
                    });
                });
            }
            let radioId_url = "https://mobile.ximalaya.com/discovery-firstpage/headline/v5/trackItems/ts-" + ts + "?code=" + getItem("addresscode", "") + "&groupId=" + getMyVar("channelId") + "&pageId=" + page + "&pageSize=8&radioGroupId=" + channelGroupId + "&radioId=" + getMyVar("radioId") + "&sourceType=7&toPlaySceneTypeFlag=true";
            let radioId_data = getFetchData(radioId_url, headers).data;
            radioId_data.list.forEach((it, i) => {
                d.push({
                    title: it.title,
                    url: $('hiker://empty##detailPage').rule((albumId) => {
                        eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                        xmlyPages.detailPage(albumId);
                    }, it.albumId),
                    col_type: "movie_1",
                    desc: it.nickname + " " + formatNumber(it.playtimes) + "次播放\n" + (it.guandian ? it.guandian : it.intro),
                    pic_url: it.wrapImgUrl ? it.wrapImgUrl : (it.coverLarge ? it.coverLarge : it.albumCoverPath)
                });

            })
        } else if (msg_type == 39) {
            //广播电台类
            if (page == 1) {
                let gbhome_url = "https://mobile.ximalaya.com/radio-first-page-app/homePage/v2";
                let gbhome_data = getFetchData(gbhome_url, headers).data;
                let modules = gbhome_data.modules;
                modules.forEach((item, i) => {
                    log(i)
                    if (item.type == "FOCUS") {
                        //头部调频
                        item.radios.forEach((it) => {
                            d.push({
                                title: it.name,
                                url: $('hiker://empty##detailPage').rule((albumId) => {
                                    eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                    xmlyPages.detailPage(albumId);
                                }, it.albumId),
                                col_type: "movie_3",
                                desc: it.programName,
                                pic_url: it.coverLarge
                            });
                        });
                    } else if (item.type == "RECOMMEND") {
                        //精品节目推荐

                    } else if (item.type == "BANNER") {
                        //焦点图
                        d.push({
                            title: "",
                            url: $('hiker://empty##detailPage').rule((linkUrl) => {
                                eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                xmlyPages.detailPage(linkUrl);
                            }, item.linkUrl),
                            col_type: "card_pic_1",
                            desc: "0",
                            pic_url: item.imageUrl
                        });
                    } else if (item.type == "SEARCH") {
                        //找电台(电台分类)
                        item.squares.forEach((it) => {
                            d.push({
                                title: it.name,
                                url: $('hiker://empty##homeRecSecondCateDetailPage?page=fypage').rule(() => {
                                    eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                    //xmlyPages.homeRecSecondCateDetailPage();
                                }),
                                col_type: "icon_small_4",
                                pic_url: it.cover
                            });
                        });
                        let categories = item.categories;
                        if (categories.length > 8) {
                            categories.slice(0, 7).forEach((tab, i) => {
                                d.push({
                                    title: tab.name,
                                    url: $('hiker://empty##homeRecSecondCateDetailPage?page=fypage').rule(() => {
                                        eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                        //xmlyPages.homeRecSecondCateDetailPage();
                                    }),
                                    col_type: "text_4",
                                    extra: {
                                        id: "categories_id_" + i
                                    }
                                });
                            })
                            let mArrTab = [];
                            categories.slice(7).forEach((tab, i) => {
                                mArrTab.push({
                                    title: tab.name,
                                    url: $('hiker://empty##homeRecSecondCateDetailPage?page=fypage').rule((id) => {
                                        eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                        //xmlyPages.homeRecSecondCateDetailPage();
                                    }, tab.id),
                                    col_type: "text_4",
                                    extra: {
                                        cls: "categories_id_cls"
                                    }
                                });
                            })
                            d.push({
                                title: "🔽",
                                url: $('hiker://empty#noLoading#').lazyRule((mArrTab) => {
                                    if (getMyVar("categories_down", "收起") == "收起") {
                                        addItemBefore('categories_the_last_id', mArrTab);
                                        putMyVar("categories_down", "展开");
                                    } else {
                                        deleteItemByCls("categories_id_cls");
                                        putMyVar("categories_down", "收起");
                                    }
                                    return "hiker://empty"
                                }, mArrTab),
                                col_type: "text_4",
                                extra: {
                                    id: "categories_the_last_id"
                                }
                            });
                            d.push({
                                col_type: "line"
                            });
                        } else {
                            categories.forEach((tab, i) => {
                                d.push({
                                    title: tab.name,
                                    url: $('hiker://empty##homeRecSecondCateDetailPage?page=fypage').rule((id) => {
                                        eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                        //xmlyPages.homeRecSecondCateDetailPage();
                                    }, tab.id),
                                    col_type: "text_4",
                                    extra: {
                                        id: "categories_id_" + i
                                    }
                                });
                            })
                        }
                        item.radios.forEach((it) => {
                            d.push({
                                title: it.name,
                                url: $('hiker://empty##detailPage').rule((id) => {
                                    eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                                    xmlyPages.detailPage(id);
                                }, it.id),
                                col_type: "movie_3",
                                desc: "正在直播: " + it.programName + "\n🎧" + formatNumber(it.playCount),
                                pic_url: it.coverLarge
                            });
                        });
                    }
                });
            }
            let radios_url = "https://mobile.ximalaya.com/radio-first-page-app/search?categoryId=0&locationId=0&locationTypeId=0&pageNum=" + page + "&pageSize=20";
            let radios_data = getFetchData(radios_url, headers).data;
            radios_data.radios.forEach((it) => {
                d.push({
                    title: it.name,
                    url: $('hiker://empty##detailPage').rule((playUrl) => {
                        eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                        xmlyPages.detailPage(playUrl);
                    }, it.playUrl),
                    col_type: "movie_3",
                    desc: "正在直播: " + it.programName + "\n🎧" + formatNumber(it.playCount),
                    pic_url: it.coverLarge
                });
            });
        } else if (cate_url.startsWith("http") || msg_type == 14) {
            //html5
            /*
            官方还有另一种html链接(https://hybrid.ximalaya.com)，这个链接应该是来自网页版数据，官方为修改统一。
            iting://open?msg_type=14&url=https://pages.ximalaya.com
            处理特殊iting链接(感觉是官方遗漏问题，没有统一为html类型)
            */
            if (/iting/.test(cate_url)) {
                cate_url = cate_url.split('url=')[1];
            }
            if (/\?/.test(cate_url)) {
                cate_url = cate_url + '&app=iting&version=9.1.35.3';
            }
            headers.Referer = cate_url;
            headers["x-requested-with"] = "com.ximalaya.ting.android";
            addWebProxyRule({
                name: 'ximalaya.com',
                match: '.*ximalaya\\.com/.*',
                requestHeaders: headers
            })
            d.push({
                col_type: "x5_webview_single",
                url: cate_url,
                desc: "float&&100%",
                title: "",
                extra: {
                    canBack: true,
                    urlInterceptor: $.toString(() => {
                        log(input);
                    })
                }
            });
        } else if (msg_type == 206) {
            //看小说，喜马拉雅官方小说APP(奇迹)
        } else {
            d.push({
                title: "此分类暂未适配",
                url: "hiker://empty",
                col_type: "text_center_1"
            });
        }
        setResult(d)
    },
    homeMoreRecommendCatePage: function () {
        //首页推荐更多分类
        var d = [];
        let {
            getHead,
            generateUUID,
            getHeaders,
            getFetchData,
            postFetchData
        } = $.require("hiker://page/publicFunction");
        let ts = new Date().getTime();
        //let url = "https://mobilehera.ximalaya.com/rms-resource-home/squares/queryMore/"+ts;
        let url = "https://mobile.ximalaya.com/rms-resource-home/squares/queryMore/" + ts;
        let public_headers = getHeaders();
        let body = {
            "itemIds": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
        let recate = postFetchData(url, public_headers, body);
        //log(recate)
        recate.data.forEach((item) => {
            d.push({
                title: item.categoryTitle,
                url: "hiker://empty",
                col_type: "text_1",
            });
            item.list.forEach((cate) => {
                let title = cate.title;
                d.push({
                    title: title,
                    url: $('hiker://empty##homeRecSecondCateDetailPage?page=fypage').rule((url) => {
                        eval(fetch('hiker://files/rules/xmly/xmlyPages.js'));
                        //xmlyPages.homeRecSecondCateDetailPage();
                    }, cate.url),
                    pic_url: cate.coverPath + "@Referer=",
                    col_type: "icon_5",
                    extra: {
                        pageTitle: title
                    }
                });
            })
            /*
            d.push({
                col_type: "line"
            });*/
        })
        setResult(d)
    },
    homeRecSecondCateDetailPage: function () {
    },
    homeLamiaFirstCateDetailPage: function () {
    },
    loginPage: function () {
        //登录
        let d = [];
        let {
            getHeaders
        } = $.require("hiker://page/publicFunction");
        d.push({
            title: "登录发现更多精彩",
            url: "toast://请登录",
            col_type: "text_1"
        });
        let headers = getHeaders();
        let ts = new Date().getTime();

        function getNonce() {
            let nonce_url = "https://passportws.ximalaya.com/mobile/nonce/" + ts;
            let nonce_data = JSON.parse(fetch(nonce_url, {
                headers: headers
            }));
            let nonce = nonce_data.nonce;
            return nonce
        }
        let nonce = getNonce();
        log("nonce: " + nonce)
        /**
        若登录请求频繁的话会触发图片验证，目前没法解决，只能等过会儿再登陆(或者重置设备ID号)
        先GET请求之前的fdsOtp_url
        然后GET请求
        URL: "https://mobile.ximalaya.com/captcha-web/check/slide/get?bpId=139&sessionId=88d6ca5d-8a3e-3da0-b714-03ba063b5ecb1683443614931"
        返回数据: {"result":"true","data":{"rotationUrl":"https://imagev2.xmcdn.com/storages/c9e4-audiofreehighqps/71/4B/GMCoOSYHMueCAAA93QG8_08G.jpg"},"upToast":"请完成安全验证","downToast":"拖动滑块旋转至正确方向","type":"rotation","needCaptcha":"false"}
        返回数据需要拖动图片处理获取验证码，目前没法完成
        需要根据图片获取对应参数完全POST请求验证
        postUrl: "https://mobile.ximalaya.com/captcha-web/valid/slider"
        postBody: {"bpId":"139","sessionId":"88d6ca5d-8a3e-3da0-b714-03ba063b5ecb1683443614931","type":"rotation","captchaText":"103","startX":87,"startY":471,"startTime":1683443617881}
        postRespose: {"msg":"captcha check success","result":"true","upToast":"请完成安全验证","downToast":"拖动滑块使拼图重合","needCaptcha":"false","token":"7289334460352025853"}
        最终请求成功后返回token数据
        */

        //验证码登录
        let phoneNumber = "15012313804";
        let fdsOtp_url = "https://mobile.ximalaya.com/captcha-web/check/slide/get?bpId=139&sessionId=" + getItem("my_uuid") + ts + "&mobile=" + phoneNumber + "&phone=" + phoneNumber + "&requestType=xmClient";
        let fdsOtp_data = JSON.parse(fetch(fdsOtp_url, {
            headers: headers
        }));
        log(fdsOtp_data)
        let fdsOtp_token = fdsOtp_data.token;
        if (fdsOtp_token) {
            eval(getCryptoJS());
            let public_key = "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCVhaR3Or7suUlwHUl2Ly36uVmboZ3+HhovogDjLgRE9CbaUokS2eqGaVFfbxAUxFThNDuXq/fBD+SdUgppmcZrIw4HMMP4AtE2qJJQH/KxPWmbXH7Lv+9CisNtPYOlvWJ/GHRqf9x3TBKjjeJ2CjuVxlPBDX63+Ecil2JR9klVawIDAQAB";
            //public_key = public_key.replace(/\\n/g, '');
            function rsaEn(text) {
                return rsaEncrypt(text, public_key, {
                    config: "RSA/ECB/PKCS1Padding",
                    type: 1,
                    "long": 1
                })
            }
            //let mobile = rsaEn(phoneNumber);
            let mobile = rsaEncrypt(phoneNumber, public_key);
            let sms_url = "https://passport.ximalaya.com/mobile/sms/v3/send";
            let sms_body = {
                "biz": "1",
                "fdsOtp": fdsOtp_token,
                "mobile": mobile,
                "nonce": nonce,
                "sendType": "1"
            };
            let sign_param = "";
            for (let key in sms_body) {
                sign_param += "&" + key + "=" + sms_body[key];
            }
            // 去掉首个 & 符号
            let productNum = "7D74899B338B4F348E2383970CC09991E8E8D8F2BC744EF0BEE94D76D718C089";
            sign_param = sign_param.substring(1) + "&MOBILE-V1-PRODUCT-" + productNum;
            sign_param = sign_param.toUpperCase();
            log("sign_param: " + sign_param)

            let signature = CryptoJS.SHA1(sign_param).toString();
            sms_body.signature = signature;
            log(sms_body)
            let sms_data = JSON.parse(fetch(sms_url, {
                headers: headers,
                body: sms_body,
                method: "post"
            }));
            log(sms_data)

            /*
            let sms_verify_url = "https://passport.ximalaya.com/mobile/sms/v2/verify";
            let sms_verify_body = {
          "code": "",
          "signature": "",
          "mobile": "",
          "nonce": ""
        }
        let sms_verify_data = JSON.parse(fetch(sms_verify_url, {
                headers: headers,
                body: sms_verify_body,
                method: "post"
            }));
            log(sms_verify_data);
            
            let bizKey = sms_verify_data.bizKey;
            let login_url = "https://passport.ximalaya.com/mobile/login/quick/v2";
            let login_body = {
          "smsKey": "1-A792CC22AFB0e3f3d6538cc6bedb2bbdb7bd8a11e08a5c389ebbda3bcb61de7420c2c3ee44",
          "signature": "06b4466032a1ec2e035dc3a5a0f2f9eccbe43e1a",
          "mobile": "UBqvKJxisvkXDB/N0OPl2f1ETNNwBMxEXyida1GixFT4J/VtyhflTCReFPFnY2ytcYTyeYCd8EEb\nEduqtHTzFc+aiNr8EP78qU2ifPP+HyFF5ORQbxgMQur2BVc5YiPCkgCkpTe1kVR8O1+i3hWb5LWR\nDHutN3ZuBjaShrYHmYI\u003d\n",
          "nonce": "0-CDD3D58D3B43e34ef1551d40f8bd9055259800efd813ebaa36f9a7ffb27085"
        };
            let login_data = JSON.parse(fetch(login_url, {
                headers: headers,
                body: login_body,
                method: "post"
            }));
            log(login_data)*/
        } else {
            toast("当前设备登录请求频繁触发图片验证了，请过段时间再试试吧！")
        }

        //账号密码登录

        //其他登录
        setResult(d)
    }
}