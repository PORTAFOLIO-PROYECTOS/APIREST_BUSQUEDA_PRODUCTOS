const config = require("../../config"),
    client = require("redis").createClient(config.redis.port, config.redis.host);

client.on("error", function (err) {
    console.log("Error Redis: " + err);
});

var redis = (function () {

    async function getRedis(name) {
        return new Promise((resolve, reject) => {
            client.get(name, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

    async function setRedis(name, value) {
        return new Promise((resolve, reject) => {
            client.set(name, value);
            resolve(true);
        });
    }
    
    return {
        getRedis: getRedis,
        setRedis: setRedis
    }
})();

module.exports = redis;