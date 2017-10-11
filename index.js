'use strict';
/**
 * Created Date: 2017-10-11 13:48:22
 * Author: inu1255
 * E-Mail: 929909260@qq.com
 * -----
 * Last Modified: 2017-10-11 16:37:22
 * Modified By: inu1255
 * -----
 * Copyright (c) 2017 gaomuxuexi
 */
const netPing = require("net-ping");
const dns = require('dns');
const session = netPing.createSession();
const co = require("co");
const request = require("request");
const fs = require("fs");

let HOST_PATH = "/etc/hosts";
const BEGIN_FLAG = "# inu1255 begin";
const END_FLAG = "# inu1255 end";

function ping(hostname) {
    return new Promise(function(resolve, reject) {
        dns.resolve(hostname, function(err, addrs) {
            if (err) {
                resolve(false);
            } else {
                session.pingHost(addrs[0], function(err, target) {
                    if (err)
                        resolve(false);
                    else
                        resolve(target);
                });
            }
        });
    });
}

function lookup(hostname) {
    return new Promise(function(resolve, reject) {
        hostname = new Buffer(hostname).toString("base64");
        request.get("http://g.inu1255.cn:4843/lookup/" + hostname, function(err, res) {
            if (err) {
                resolve(false);
                return;
            }
            const addrs = JSON.parse(res.body);
            resolve(addrs[0]);
        });
    });
}

const hostname = "bolt.dropbox.com";

function hosts(hostname) {
    return co(function*() {
        // 如果 ping 不通
        let ok = yield ping(hostname);
        if (ok) {
            return;
        }
        // 获取 ip
        let ip = yield lookup(hostname);
        // 如果 ip ping 通
        ok = yield ping(ip);
        if (ok) {
            hosts.data[hostname] = ip;
            console.log("添加host:", ip, hostname);
            yield saveHosts();
        } else {
            console.log("无法ping通:", ip, hostname);
        }
    });
}

function loadHosts() {
    return new Promise(function(resolve, reject) {
        fs.readFile(HOST_PATH, function(err, body) {
            if (err) {
                reject(err);
                return;
            }
            let para = body.toString().split(BEGIN_FLAG);
            hosts.head = para[0];
            let tail = (para[1] || "").split(END_FLAG);
            let content = tail[0];
            hosts.tail = (tail[1] || "");

            let lines = content.split("\n");
            hosts.data = {};
            for (let line of lines) {
                line = line.trim();
                if (!line) continue;
                if (line[0] === "#") continue;
                let ss = line.split(/\s/);
                if (ss.length != 2) continue;
                hosts.data[ss[1]] = ss[0];
            }
            resolve(hosts.data);
        });
    });
}

function saveHosts() {
    return new Promise(function(resolve, reject) {
        let s = BEGIN_FLAG + "\n\n";
        for (let k in hosts.data) {
            let v = hosts.data[k];
            s += v + "\t" + k + "\n";
        }
        s += "\n" + END_FLAG;
        console.log(hosts.head + s + hosts.tail);
        fs.writeFile(HOST_PATH, hosts.head + s + hosts.tail, function(err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}

exports.config = function() {
    return co(function*() {
        yield loadHosts();
        return hosts;
    });
};