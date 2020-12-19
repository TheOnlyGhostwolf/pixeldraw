const Discord = require("discord.js");
const Jimp = require("jimp");
const config = require("./config.json");

const client = new Discord.Client();

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity(`with ${config.size.width}x${config.size.height} canvas! | ${config.prefix}help`,`PLAYING`)
})

function error(err, message) {
    return message.channel.send(new Discord.MessageEmbed().setColor(config.colors.red).setDescription(err).setFooter(`Requested by ${message.author.tag}`, message.author.avatarURL({ dynamic: true }))).catch(e => { message.reply(`I can't send embeds in this channel!`) }).catch(e => { message.author.send(`I can't send messages in that channel!`) }).catch(e => { /*  oof  */ })
}

client.on("error", e => {
    console.error(`Something went wrong: ${e}`);
})

client.on("message", message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(config.prefix)) return;

    let messages = message.content.split(" ");
	let command = messages[0].slice(config.prefix.length);
    let args = messages.slice(1);

    var x = Number(args[1]);
    var y = Number(args[2]);

    if (command == `help`) {
        var embed = new Discord.MessageEmbed().setColor(config.colors.orange)
            .setFooter(`Requested by ${message.author.tag}`, message.author.avatarURL({ dynamic: true }))
            .setAuthor(`How to use pixeldraw?`, client.user.avatarURL({ dynamic: true }))
            .setDescription(`This bot is a small experiment made by Ghostwolf.\nPlace your pixels on the canvas using commands and work together on making something big! :D`)
            .addField(`${config.prefix}add <color> <x> <y>`, `Place your pixel on the canvas. <color> represents color, <x> represents pixel's placement on the "x" axis, <y> - on the "y" axis.`)
            .addField(`${config.prefix}colors`, `See all available colors`)
            .addField(`${config.prefix}generate`, `Generates a random canvas`)
            .addField(`${config.prefix}show`, `Shows the current canvas`);
        if (message.author.id == config.developer) embed.addField(`${config.prefix}reset`, `[DEV ONLY] Resets the canvas`)
        
        return message.channel.send(embed).catch(e => { error(`I can't send embeds in this channel!`, message) })
    }

    if (command == `colors`) {
        var description = ``;
        for (var color in config.colors) {
            if (config.colors.hasOwnProperty(color)){
                description += `\`${color}\`\n`;
            }
        }
        var embed = new Discord.MessageEmbed().setColor(config.colors.orange)
            .setFooter(`Requested by ${message.author.tag}`, message.author.avatarURL({ dynamic: true }))
            .setAuthor(`Available colors`, client.user.avatarURL({ dynamic: true }))
            .setDescription(description);

        return message.channel.send(embed).catch(e => { error(`I can't send embeds in this channel!`, message) });
    }

    if (command == `generate`) {
        new Jimp(config.size.height, config.size.width, '#FFFFFF', (err, image) => {
            if (err) return message.reply(`Something went wrong: \`${err}\``);

            console.log(config.size);

            var i = 0, j = 0;
            while (i < config.size.height) {
                while (j < config.size.width) {
                    var color = Object.values(config.colors)[Math.floor((Math.random() * Object.keys(config.colors).length))];
                    image.setPixelColor(parseInt(color+"ff", 16), i, j);
                    j++;
                }
                i++;
                j = 0;
            }

            image.resize(config.size.height*100, config.size.width*100, Jimp.RESIZE_NEAREST_NEIGHBOR);
            image.write('generated.png');
            return message.reply(`Here's a randomly generated image!`, { files: [{ attachment: './generated.png', name: 'generated.png' }] }).catch(err => { error(`I couldn't send an attachement!`, message); });
        });
    }

    if (command == `add`) {
        if (!config.colors.hasOwnProperty(args[0])) return error(`That color doesn't exist!`, message);
        if (isNaN(Math.round(args[1])) || isNaN(Math.round(args[2]))) return error(`<x> and <y> must be numbers!`, message);
        if (args[1] <= 0 || args[1] > config.size.height) return error(`<x> must be more than 0 and less or equal to ${config.size.height}`, message);
        if (args[2] <= 0 || args[2] > config.size.width) return error(`<y> must be more than 0 and less or equal to ${config.size.width}`, message);

        Jimp.read('canvas.png').then(image => {
            image.resize(config.size.height, config.size.width, Jimp.RESIZE_NEAREST_NEIGHBOR);
            for (var color in config.colors) {
                if (color == args[0].toLowerCase()) {
                    image.setPixelColor(parseInt(config.colors[color]+"ff", 16), x-1, y-1);
                }
            }
            image.resize(config.size.height * 100, config.size.width * 100, Jimp.RESIZE_NEAREST_NEIGHBOR);
            image.write('canvas.png');
            message.reply(`Added your \`${args[0]}\` pixel to x: \`${args[1]}\`, y: \`${args[2]}\`!`, { files: [{ attachment: './canvas.png', name: 'canvas.png' }] }).catch(err => { error(`I couldn't send an attachement! Nevertheless, your pixel was added!`, message); });
        }).catch(e => {
            new Jimp(config.size.height, config.size.width, '#FFFFFF', (err, image) => {
                if (err) return message.reply(`Something went wrong: ${err}`)
                for (var color in config.colors) {
                    if (color == args[0].toLowerCase()) {
                        image.setPixelColor(parseInt(config.colors[color]+"ff", 16), x-1, y-1);
                    }
                }
                image.resize(config.size.height * 100, config.size.width * 100, Jimp.RESIZE_NEAREST_NEIGHBOR);
                image.write('canvas.png');
                message.reply(`Added your \`${args[0]}\` pixel to x: \`${args[1]}\`, y: \`${args[2]}\`!`, { files: [{ attachment: './canvas.png', name: 'canvas.png' }] }).catch(err => { error(`I couldn't send an attachement! Nevertheless, your pixel was added!`, message); });
            })
        })
    }
    if (command == `reset`) {
        if (message.author.id == config.developer) {
            new Jimp(config.size.height * 100, config.size.width * 100, '#FFFFFF', (err, image) => {
                image.write('canvas.png');
                return message.reply(`:ok_hand:`);
            });
        }
    }
    if (command == `show`) {
        Jimp.read('canvas.png').then(image => {
            message.reply(`here you go!`, { files: [{ attachment: './canvas.png', name: 'canvas.png' }] }).catch(err => { error(`I couldn't send an attachement!`, message); });
        }).catch(err => {
            error(`The canvas doesn't exist yet :(`, message);
        })
    }
})

client.login(config.token)