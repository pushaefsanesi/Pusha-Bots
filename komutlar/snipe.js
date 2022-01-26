const { MessageEmbed } = require("discord.js");
const Discord = require("discord.js");
const db = require("quick.db");
const moment = require("moment");
const ayarlar = require('../ayarlar.json');

require('moment-duration-format');
exports.run = async(client, message, args, guild) => {
    let embed = new MessageEmbed().setColor("#000000").setFooter(ayarlar.footer);
    let data = db.get(`snipe.${message.guild.id}`);
    if(!data) return message.channel.send(embed.setDescription(`Sunucuda Daha Önce Mesaj Silinmemiş.`)).catch(e => { });
    message.channel.send(embed.setDescription(`
    \`Yazan Kişi:\` <@${data.mesajyazan}>
    \`Mesaj:\` (**${data.mesaj}**)
    \`Yazılma Tarihi:\` ${moment.duration(Date.now() - data.ytarihi).format("D [gün], H [saat], m [dakika], s [saniye]")} **Önce Yazılmış**
    \`Silinme Tarihi:\` ${moment.duration(Date.now() - data.starihi).format("D [gün], H [saat], m [dakika], s [saniye]")} **Önce Silinmiş**
    \`Kanal:\` <#${data.kanal}>
    `)).then(x => x.delete({timeout: 10000}));
};


exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: ["snipe"],
    permLevel: 0,
    name: "snipe"
  }
  
  exports.help = {
    name: "snipe"
  };
  