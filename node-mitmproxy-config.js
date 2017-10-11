'use strict';
/**
 * Created Date: 2017-10-11 14:18:50
 * Author: inu1255
 * E-Mail: 929909260@qq.com
 * -----
 * Last Modified: 2017-10-11 16:23:02
 * Modified By: inu1255
 * -----
 * Copyright (c) 2017 gaomuxuexi
 */
const wall = require("./index");

var hosts;
wall.config().then(function(h) {
    hosts = h;
    console.log("初始化成功", typeof h);
});

module.exports = {
    sslConnectInterceptor: (req, cltSocket, head) => {
        if (hosts) {
            const hostname = req.url.split(":")[0];
            console.log(hostname);
            hosts(hostname);
        }
        return false;
    },
    requestInterceptor: (rOptions, req, res, ssl, next) => {
        // console.log(`正在访问：${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}`);
        next();
    }
};