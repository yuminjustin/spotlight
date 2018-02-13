#!/usr/bin/env node

const download = require('download-git-repo')
const program = require('commander')
const exists = require('fs').existsSync
const path = require('path')
const ora = require('ora')
const home = require('user-home')
const tildify = require('tildify')
const chalk = require('chalk')
const inquirer = require('inquirer')
const rm = require('rimraf').sync
const generate = require('../lib/generate')
const checkVersion = require('../lib/check-version')


const untils = require('../lib/untils')
const logger = untils.logger
const warnings = untils.warnings
const getTemplatePath = untils.getTemplatePath


module.exports = (program) => {


    program
        .usage('<template-name> [project-name]')
        .option('-c, --clone', 'use git clone')
        .option('--offline', 'use cached template')
    const template = program.args[0] == 'mobx' ? 'react-mobx' : program.args[0] // 使用模板
    const url = `yuminjustin/spotlight-templates-${template}`
    const rawName = program.args[1] // 目录
    const inPlace = !rawName || rawName === '.' // 是否在当前目录
    const name = inPlace ? path.relative('../', process.cwd()) : rawName
    const to = path.resolve(rawName || '.') // 目标目录

    const clone = program.clone || false

    // 本地
    const tmp = path.join(home, '.spotlight-templates', template.replace(/\//g, '-'))


    try {

        if (exists(to)) {
            inquirer.prompt([{
                type: 'confirm',
                message: inPlace ? '在当前目录中生成项目/Generate project in current directory?' : '此目录已存在，是否继续/Target directory exists. Continue?',
                name: 'ok'
            }]).then(answers => {
                if (answers.ok) {
                    run()
                }
            }).catch(logger.fatal)
        } else {
            run()
        }

    } catch (e) {
        warnings.commandError()
    }

    function run() {
        // 检查版本 -> 下载模板
        checkVersion(() => {
            downloadAndGenerate()
        })
    }


    function downloadAndGenerate() {
        const spinner = ora('正在下载模板/downloading template')
        spinner.start()
        // 删除本地文件
        if (exists(tmp)) rm(tmp)

        download(url, tmp, {
            clone
        }, err => {
            spinner.stop()
            if (err) logger.fatal('下载失败/download failed ' + template + ': ' + err.message.trim())
            generate(name, tmp, to, err => {
                if (err) logger.fatal(err)
                console.log()
                logger.success('Generated "%s".', name)
            })
        })
    }

}
