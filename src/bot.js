require('dotenv').config()

const path = require('path')
const { exec } = require('child_process')
const { Telegraf, session } = require('telegraf')

const bot = new Telegraf(process.env.TOKEN)

const concatPaths = (currentPath = '', newPath = '') => {
    currentPath = currentPath.split('/').filter(Boolean)
    newPath = newPath.split('/').filter(Boolean)

    return path.join(...currentPath, ...newPath)
}

const isLoggedIn = (ctx, next) => {
    if (ctx.session.isLoggedIn) {
        return next()
    }

    return ctx.reply('Unauthorized')
}

bot.use(session())

bot.catch(err => console.log(err))

bot.hears(/^\/login .+$/, ctx => {
    const [command, password] = ctx.match[0].split(' ')

    if (password === process.env.PASSWORD) {
        ctx.session.isLoggedIn = true
        ctx.session.path = '../'

        return ctx.reply('Success')
    }

    return ctx.reply('Failed')
})

bot.use(isLoggedIn)

bot.command('/logout', ctx => {
    ctx.session.isLoggedIn = false

    return ctx.reply('Goodbye')
})

bot.command('/reset', ctx => {
    ctx.session.path = ''
})

bot.on('text', ctx => {
    const command = ctx.message.text

    exec(command, { cwd: ctx.session.path || '' }, (err, stdout, stderr) => {
        try {
            const [cmd, ...args] = command.split(' ')

            if (!err && cmd === 'cd') {
                ctx.session.path = concatPaths(ctx.session.path, args[0])
            }

            const result = err || stdout || stderr

            ctx.deleteMessage()

            if (result) {
                ctx.reply(`<b>$ </b> <code>${command}</code>\n\n<code>${result}</code>`, { parse_mode: 'HTML' })
            } else {
                ctx.reply('<code>Yes</code>', { parse_mode: 'HTML' })
            }
        } catch (err) {
            console.log(err)
        }
    })
})

bot.launch()
