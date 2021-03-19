const fs = require('fs');
const jsonfile = require('jsonfile');
const { createClient } = require("oicq");

jsonfile.readFile("./config.json", function (err, config) {

  if (err) { console.error(err); return; }

  var bot = createClient(config.bot_id, { log_level: "warn" });

  bot.on("system.login.slider", () => {
    process.stdin.once("data", (input) => bot.sliderLogin(input)); // 滑动验证
  });

  bot.on("system.login.device", () => {
    process.stdin.once("data", () => bot.login()); // 设备锁验证
  });

  bot.on("notice.group.increase", (data) => { //监听群成员加入

    if (!checkListen(data.group_id)) return;

    joinTips(data);

  });

  bot.login(config.password); // 登录

  /*-------------------------------------------------------------------------*/

  /** 检查群组是否需要监听 */
  function checkListen(group_id) {

    for (let index = 0; index < config.listen.length; index++) {
      if (config.listen[index] == group_id) return true;
    }

    return false;

  }

  /** 入群提示 */
  function joinTips(data) {

    if (!config.function.join_tips) return;

    let tips = config.tipsTemplate.join.replace("[nickname]", "[CQ:at,qq=" + data.user_id + "]");
    bot.sendGroupMsg(data.group_id, tips);

  }

});
