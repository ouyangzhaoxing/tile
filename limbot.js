const fs = require('fs');
const jsonfile = require('jsonfile');
const sqlite3 = require('sqlite3').verbose();
const { createClient } = require("oicq");

jsonfile.readFile("./config.json", function (err, config) {

  if (err) { console.error(err); return; }

  var violationData = new sqlite3.Database("./data.sqlite3"); // 打开数据库（违规数据）

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

    checkNickname(data);

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

  /** 检查昵称是否违规 */
  function checkNickname(data) {

    if (!config.function.banned_name) return;

    let cmd = "SELECT * FROM NAME_BAN_KEY WHERE INSTR($NAME, KEY) > 0;";
    violationData.get(cmd, { $NAME: data.nickname }, function (err, row) {

      if (row === undefined) return;

      bot.setGroupCard(data.group_id, data.user_id, "昵称违规"); // 修改名片

      if (config.function.banned_name_tips) { // 违规提示

        let tips = "昵称违规";

        if (row.EXEC === "BAN") tips = config.tipsTemplate.banned_name_ban;
        else if (row.EXEC === "KICK") tips = config.tipsTemplate.banned_name_kick;

        tips = tips.replace("[nickname]", "[CQ:at,qq=" + data.user_id + "]");

        bot.sendGroupMsg(data.group_id, tips);

      }

      if (config.function.banned_name_kick && row.EXEC === "KICK") // 违规直接踢出群组
        bot.setGroupKick(data.group_id, data.user_id);

    });

  }

});
