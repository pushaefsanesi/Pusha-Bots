const Discord = require('discord.js');
const client = new Discord.Client();
const ayarlar = require('./ayarlar.json');
const chalk = require('chalk');
const moment = require('moment');
var Jimp = require('jimp');
const { Client, Util } = require('discord.js');
const fs = require('fs');
const db = require('quick.db');
const database = require("quick.db");
const express = require('express');
require('./util/eventLoader.js')(client);
const path = require('path');
const snekfetch = require('snekfetch');
const ms = require('ms');


var prefix = ayarlar.prefix;


const log = message => {
    console.log(`${message}`);
};

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir('./komutlar/', (err, files) => {
    if (err) console.error(err);
    log(`${files.length} komut yüklenecek.`);
    files.forEach(f => {
        let props = require(`./komutlar/${f}`);
        log(`Yüklenen komut: ${props.help.name}.`);
        client.commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
            client.aliases.set(alias, props.help.name);
        });
    });
});




client.reload = command => {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./komutlar/${command}`)];
            let cmd = require(`./komutlar/${command}`);
            client.commands.delete(command);
            client.aliases.forEach((cmd, alias) => {
                if (cmd === command) client.aliases.delete(alias);
            });
            client.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                client.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

client.load = command => {
    return new Promise((resolve, reject) => {
        try {
            let cmd = require(`./komutlar/${command}`);
            client.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                client.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};



client.unload = command => {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./komutlar/${command}`)];
            let cmd = require(`./komutlar/${command}`);
            client.commands.delete(command);
            client.aliases.forEach((cmd, alias) => {
                if (cmd === command) client.aliases.delete(alias);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

client.elevation = message => {
    if (!message.guild) {
        return;
    }

    let permlvl = 0;
    if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
    if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
    if (message.author.id === ayarlar.sahip) permlvl = 4;
    return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
// client.on('debug', e => {
//   console.log(chalk.bgBlue.green(e.replace(regToken, 'that was redacted')));
// });
client.on('warn', e => {
    console.log(chalk.bgYellow(e.replace(regToken, 'that was redacted')));
});
client.on('error', e => {
    console.log(chalk.bgRed(e.replace(regToken, 'that was redacted')));
});

client.login(ayarlar.token);

//-----------------------TAG-ROL----------------------\\

client.on("userUpdate", async (user, yeni) => {
  var sunucu = client.guilds.cache.get(ayarlar.sunucuid);
  var uye = sunucu.members.cache.get(yeni.id);
  var tag = ayarlar.tag; 
  var tagrol = ayarlar.tagrol;
  var logKanali = ayarlar.taglog; 

  if (!sunucu.members.cache.has(yeni.id) || yeni.bot || user.username === yeni.username) return;
  
  if ((yeni.username).includes(tag) && !uye.roles.cache.has(tagrol)) {
    try {
      await uye.roles.add(tagrol);
      await client.channels.cache.get(logKanali).send(new Discord.MessageEmbed().setColor('GREEN').setDescription(`${yeni} adlı üye tagımızı alarak aramıza katıldı.`));
    } catch (err) { console.error(err) };
  };
  
  if (!(yeni.username).includes(tag) && uye.roles.cache.has(tagrol)) {
    try {
      await uye.roles.remove(uye.roles.cache.filter(rol => rol.position >= sunucu.roles.cache.get(tagrol).position));
      await client.channels.cache.get(logKanali).send(new Discord.MessageEmbed().setColor('RED').setDescription(`${yeni} adlı üye tagımızı bırakarak aramızdan ayrıldı.`));
    } catch(err) { console.error(err) };
  };
});

//
// Tag aldığında rol verir, tag çıkardığında tag rolünü ve onun üstündeki her rolü alır!
//

//----------------------TAG-KONTROL----------------------\\     

client.on("guildMemberAdd", member => {
  let sunucuid = ayarlar.sunucuid; 
  let tag = ayarlar.tag; 
  let rol = ayarlar.tagrol; 
if(member.user.username.includes(tag)){
member.roles.add(rol)
  const tagalma = new Discord.MessageEmbed()
      .setColor("BLUE")
      .setDescription(`<@${member.id}> taglı olarak girdi!`)
      .setTimestamp()
     client.channels.cache.get(ayarlar.taglog).send(tagalma) 
}
})

/////////////////////////////////////////////////////////////

client.on("ready", async function() {
    client.channels.cache.get(ayarlar.botkanal).join()
    .catch(err => {
    throw err;
    })
    })


////////////////////////////////////////////////////////////// Snipe


client.on("messageDelete", async(message) => {
    if (message.channel.type === "dm" || !message.guild || message.author.bot) return;
  let snipe = {
  mesaj: message.content,
  mesajyazan: message.author.id,
  ytarihi: message.createdTimestamp,
  starihi: Date.now(), 
  kanal: message.channel.id
  }
  await db.set(`snipe.${message.guild.id}`, snipe)
  }); 
  
  


//////////////////////////////////////////////////////////////////////


let yasaktag = ayarlar.yasaktag
let unregister = ayarlar.unregister
 
client.on('guildMemberAdd', member => {
    let yasaklitaglar = db.fetch(`yasaklitaglar_${member.guild.id}`)
    if(!yasaklitaglar) return db.set(`yasaklitaglar_${member.guild.id}`)
    yasaklitaglar.forEach(tag => {
        if(member.user.username.includes(tag)) {
            try {
                db.add(`yasaklitagengel_${member.guild.id}_${tag}`, 1)
                member.send(`${tag} Sunucumuzda ki Yasaklı Taglar Arasındadır Bu Tagı Bırakmadığın Sürece Sunucumuza Erişeyemeceksin.`)
                } catch (e) {
                console.log(e)
            }
            member.roles.cache.forEach(rol => {
                member.roles.remove(rol.id)
              })
              member.roles.add(yasaktag)
        }
    })
})
 
client.on('userUpdate', (oldUser, newUser, message) => {
    let yasaklitaglar = db.fetch(`yasaklitaglar_${message.guild.id}`)
    if(!yasaklitaglar) return db.set(`yasaklitaglar_${message.guild.id}`)
    if(oldUser.username !== newUser.username) {
        let member = client.guilds.cache.get(message.guild.id).members.cache.get(oldUser.id)
        yasaklitaglar.forEach(tag => {
            if(oldUser.username.includes(tag) && !newUser.username.includes(tag)) {
                member.roles.cache.forEach(rol => {
                    member.roles.remove(rol.id)
                  })
                  member.roles.add(unregister)
                try {
                    member.send(`${tag} Tagını Adından Çıkardığın İçin Teşekkür Ederiz Eğer Adında Başka Yasaklı Tag Yoksa Kayıtsız'a Atılacaksın.`)
               } catch (e) {
                   console.log(e)
               }
               return;
           }
           if(!oldUser.username.includes(tag) && newUser.username.includes(tag)) {
               member.roles.cache.forEach(rol => {
                   member.roles.remove(rol.id)
               })
               member.roles.add(yasaktag)
               try {
                   member.send(`${tag} Tagı Sunucumuzun Yasaklı Tagları Arasında Olduğundan Dolayı Sunucumuzun Kanallarına Erişimin Engellendi.`)
               } catch (e) {
                   console.log(e)
               }
               return;
           }
       })
       setTimeout( () => {
       yasaklitaglar.forEach(tag => {
           if(newUser.username.includes(tag)) {
               member.roles.cache.forEach(rol => {
                   member.roles.remove(rol.id)
                 })
                 member.roles.add(yasaktag)
           }
           return;
       })
       }, 1000)
   }
})


////////////////////////////////////////////////////////////////////////////

              
 ///----------------------- HOŞGELDİN MESAJI KISMI -----------------------\\\\   
const invites = {};
const wait = require("util").promisify(setTimeout);
client.on("ready", () => {
  wait(1000);
  client.guilds.cache.forEach(g => {
    g.fetchInvites().then(guildInvites => {
      invites[g.id] = guildInvites;
    });
  });
});



client.on("guildMemberAdd", member => {
    
    if (member.user.bot) return;

    member.guild.fetchInvites().then(async guildInvites => {
      const ei = invites[member.guild.id];
  
      invites[member.guild.id] = guildInvites;
  
      const invite = await guildInvites.find(
        i => (ei.get(i.code) == null ? i.uses - 1 : ei.get(i.code).uses) < i.uses
      );
  
      const daveteden = member.guild.members.cache.get(invite.inviter.id);
  
      db.add(`davet_${invite.inviter.id}_${member.guild.id}`, +1);
  
      db.set(`bunudavet_${member.id}`, invite.inviter.id);
  
      let davetsayiv2 = await db.fetch(
        `davet_${invite.inviter.id}_${member.guild.id}`
      );
  
      let davetsayi;
  
      if (!davetsayiv2) davetsayi = 0;
      else
        davetsayi = await db.fetch(
          `davet_${invite.inviter.id}_${member.guild.id}`
        );
    let date = moment(member.user.createdAt)
       const startedAt = Date.parse(date);
       var msecs = Math.abs(new Date() - startedAt);
         
       const years = Math.floor(msecs / (1000 * 60 * 60 * 24 * 365));
       msecs -= years * 1000 * 60 * 60 * 24 * 365;
       const months = Math.floor(msecs / (1000 * 60 * 60 * 24 * 30));
       msecs -= months * 1000 * 60 * 60 * 24 * 30;
       const weeks = Math.floor(msecs / (1000 * 60 * 60 * 24 * 7));
       msecs -= weeks * 1000 * 60 * 60 * 24 * 7;
       const days = Math.floor(msecs / (1000 * 60 * 60 * 24));
       msecs -= days * 1000 * 60 * 60 * 24;
       const hours = Math.floor(msecs / (1000 * 60 * 60));
       msecs -= hours * 1000 * 60 * 60;
       const mins = Math.floor((msecs / (1000 * 60)));
       msecs -= mins * 1000 * 60;
       const secs = Math.floor(msecs / 1000);
       msecs -= secs * 1000;
         
       var string = "";
       if (years > 0) string += `${years} yıl ${months} ay`
       else if (months > 0) string += `${months} ay ${weeks > 0 ? weeks+" hafta" : ""}`
       else if (weeks > 0) string += `${weeks} hafta ${days > 0 ? days+" gün" : ""}`
       else if (days > 0) string += `${days} gün ${hours > 0 ? hours+" saat" : ""}`
       else if (hours > 0) string += `${hours} saat ${mins > 0 ? mins+" dakika" : ""}`
       else if (mins > 0) string += `${mins} dakika ${secs > 0 ? secs+" saniye" : ""}`
       else if (secs > 0) string += `${secs} saniye`
           
         
       string = string.trim();
   
       let guild = member.client.guilds.cache.get("") //sunucu idsi
       let log = guild.channels.cache.get(""); //mesajı atıcağı kanal
       let endAt = member.user.createdAt
       let gün = moment(new Date(endAt).toISOString()).format('DD')
       let ay = moment(new Date(endAt).toISOString()).format('MM').replace("01", "Ocak").replace("02", "Şubat").replace("03", "Mart").replace("04", "Nisan").replace("05", "Mayıs").replace("06", "Haziran").replace("07", "Temmuz").replace("08", "Ağustos").replace("09", "Eylül").replace("10", "Ekim").replace("11", "Kasım").replace("12", "Aralık")
       let yıl = moment(new Date(endAt).toISOString()).format('YYYY')
       let saat = moment(new Date(endAt).toISOString()).format('HH:mm')
       let kuruluş = `${gün} ${ay} ${yıl} ${saat}`;
       log.send(`
:tada: ${member} Sunucumuza hoş geldin! 
   
Hesabın **${kuruluş} (${string})** önce oluşturulmuş.
   
Sunucu kurallarımız <#KURALLAR> kanalında yazıyor okumayı unutma! **ceza-i işlemlerin** kuralları okuduğunu varsayarak gerçekleştirilecek.
   
Seninle birlikte **${member.guild.memberCount}** üyeye ulaştık!
**Davet eden:** ${daveteden} \`${davetsayi}.\` davetini gerçekleştirdi.`)
})});
client.on("guildMemberRemove", async member => {
    let davetçi = await db.fetch(`bunudavet_${member.id}`);
  
    const daveteden = member.guild.members.cache.get(davetçi);
  
    db.add(`davet_${davetçi}_${member.guild.id}`, -1);
  })
    


////----------------------- HOŞGELDİN MESAJI KISMI -----------------------\\\\ 