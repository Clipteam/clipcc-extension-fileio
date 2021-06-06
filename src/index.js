const ClipCC = require('clipcc-extension');



const isClipCCDesktop = (window.process != undefined);
if (isClipCCDesktop) {
    eval('window.electron = require("electron")');
    eval('window.fs = require("fs")');
}

class FileIOExtension extends ClipCC.Extension {
    init() {
        this.FileAccessPermissionLevel = 0
        this.fileContent = ''
        this.userSelectPath = ''

        ClipCC.API.addCategory({
            categoryId: 'fileio.category',
            messageId: 'fileio.category.name',
            color: '#339900'
        })

        // CC桌面版独有模块
        if (isClipCCDesktop) {
            // 申请文件管理权限
            ClipCC.API.addBlock({
                opcode: 'fileio.blocks.applyforfilemanagement',
                type: ClipCC.Type.BlockType.COMMAND,
                messageId: 'fileio.blocks.applyforfilemanagement',
                categoryId: 'fileio.category',
                function: () => this.applyForFileManagement()
            })
            // 还回文件管理权限
            ClipCC.API.addBlock({
                opcode: 'fileio.blocks.revokefilemanagement',
                type: ClipCC.Type.BlockType.COMMAND,
                messageId: 'fileio.blocks.revokefilemanagement',
                categoryId: 'fileio.category',
                function: () => this.revokeFileManagement()
            })
            // 是否拥有外部权限
            ClipCC.API.addBlock({
                opcode: 'fileio.blocks.hasfilemanagement',
                type: ClipCC.Type.BlockType.BOOLEAN,
                messageId: 'fileio.blocks.hasfilemanagement',
                categoryId: 'fileio.category',
                function: () => this.hasFileManagement()
            })
            // 从[PATH]异步获取文件内容
            ClipCC.API.addBlock({
                opcode: 'fileio.blocks.openfileasync',
                type: ClipCC.Type.BlockType.COMMAND,
                messageId: 'fileio.blocks.openfileasync',
                categoryId: 'fileio.category',
                argument: {
                    PATH: {
                        type: ClipCC.Type.ArgumentType.STRING,
                        default: 'ClipCC.txt'
                    }
                },
                function: args => this.openFileAsync(args.PATH)
            })
            // 从[PATH]同步获取文件内容
            ClipCC.API.addBlock({
                opcode: 'fileio.blocks.openfilesync',
                type: ClipCC.Type.BlockType.REPORTER,
                messageId: 'fileio.blocks.openfilesync',
                categoryId: 'fileio.category',
                argument: {
                    PATH: {
                        type: ClipCC.Type.ArgumentType.STRING,
                        default: 'ClipCC.txt'
                    }
                },
                function: args => this.openFileSync(args.PATH)
            })
            // 创建文件[PATH]
            ClipCC.API.addBlock({
                opcode: 'fileio.blocks.createfile',
                type: ClipCC.Type.BlockType.COMMAND,
                messageId: 'fileio.blocks.createfile',
                categoryId: 'fileio.category',
                argument: {
                    PATH: {
                        type: ClipCC.Type.ArgumentType.STRING,
                        default: 'ClipCC.txt'
                    }
                },
                function: args => this.createFile(args.PATH)
            })
            // 写入文件[PATH]内容为[CONTENT]
            ClipCC.API.addBlock({
                opcode: 'fileio.blocks.writefile',
                type: ClipCC.Type.BlockType.COMMAND,
                messageId: 'fileio.blocks.writefile',
                categoryId: 'fileio.category',
                argument: {
                    PATH: {
                        type: ClipCC.Type.ArgumentType.STRING,
                        default: 'ClipCC.txt'
                    },
                    CONTENT: {
                        type: ClipCC.Type.ArgumentType.STRING,
                        default: 'ClipCC Yes!'
                    }
                },
                function: args => this.writeFile(args.PATH,args.CONTENT)
            })
             // 删除文件[PATH]
            ClipCC.API.addBlock({
                opcode: 'fileio.blocks.deletefile',
                type: ClipCC.Type.BlockType.COMMAND,
                messageId: 'fileio.blocks.deletefile',
                categoryId: 'fileio.category',
                argument: {
                    PATH: {
                        type: ClipCC.Type.ArgumentType.STRING,
                        default: 'ClipCC.txt'
                    }
                },
                function: args => this.deleteFile(args.PATH)
            })
            // 文件内容
            ClipCC.API.addBlock({
                opcode: 'fileio.blocks.filecontent',
                type: ClipCC.Type.BlockType.REPORTER,
                messageId: 'fileio.blocks.filecontent',
                categoryId: 'fileio.category',
                function: () => this.fileContent
            })
            // 文件[PATH]是否存在？
            ClipCC.API.addBlock({
                opcode: 'fileio.blocks.fileexists',
                type: ClipCC.Type.BlockType.BOOLEAN,
                messageId: 'fileio.blocks.fileexists',
                categoryId: 'fileio.category',
                argument: {
                    PATH: {
                        type: ClipCC.Type.ArgumentType.STRING,
                        default: 'ClipCC.txt'
                    },
                },
                function: args => this.fileExists(args.PATH)
            })
            // 从文件选择器选取文件
            ClipCC.API.addBlock({
                opcode: 'fileio.blocks.selectfile',
                type: ClipCC.Type.BlockType.COMMAND,
                messageId: 'fileio.blocks.selectfile',
                categoryId: 'fileio.category',
                function: () => this.selectFile()
            })
            // 用户选择的文件路径
            ClipCC.API.addBlock({
                opcode: 'fileio.blocks.userselectpath',
                type: ClipCC.Type.BlockType.REPORTER,
                messageId: 'fileio.blocks.userselectpath',
                categoryId: 'fileio.category',
                function: () => this.userSelectPath
            })
        }
    }
    uninit() {
        ClipCC.API.removeCategory('fileio.category');
        delete window.electron
        delete window.fs
    }
    applyForFileManagement() {
        if (!isClipCCDesktop) return;
        this.FileAccessPermissionLevel = window.electron.remote.dialog.showMessageBoxSync(
            window.electron.remote.getCurrentWindow(),
            {
                type:'warning',
                buttons:['拒绝','允许','仅允许一次'],
                defaultId:1,
                cancelId:0,
                message:'敏感权限申请警告',
                detail:'外部交互权限可以对您的计算机造成不可挽回的损害。请明确你在干什么！这很危险！'
            }
        )
        
    }
    revokeFileManagement() {
        if (!isClipCCDesktop) return;
        this.FileAccessPermissionLevel = 0;
    }

    hasFileManagement() {
        return !!this.FileAccessPermissionLevel
    }
    
    openFileSync(PATH) {
        if (!isClipCCDesktop) return
        if (!this.hasFileAccessPermission()) return '*ERROR: NO PERMISSON!'
        let file
        try {
            file = window.fs.readFileSync(PATH)
        } catch  {
            return '*ERROR: FILE NOT FOUNT!'
        }
        return file.toString()
        
    }

    openFileAsync(PATH) {
        if (!isClipCCDesktop) return
        if (!this.hasFileAccessPermission()) {
            this.fileContent = '*ERROR: NO PERMISSON!'
            return
        } 
        window.fs.readFile(PATH, (err,data) => {
            if (err) {
                this.fileContent = '*ERROR: '+err.toString()
            } else {
                this.fileContent = data.toString()
            }
        })       
    }

    fileExists(PATH) {
        if (!this.hasFileAccessPermission()) return false
        return window.fs.existsSync(PATH)
    }

    createFile(PATH) {
        if (!this.hasFileAccessPermission()) return
        try {
            window.fs.writeFileSync(PATH,'')
        } catch {}
    }

    writeFile(PATH,CONTENT) {
        if (!this.hasFileAccessPermission()) return
        try {
            window.fs.writeFileSync(PATH,CONTENT)
        } catch {}
    }

    deleteFile(PATH) {
        if (!this.hasFileAccessPermission()) return
        try {
            window.fs.rmSync(PATH)
        } catch {}
    }
    
    selectFile() {
        if (!this.hasFileAccessPermission()) return
        this.userSelectPath = ''
        const result = window.electron.remote.dialog.showOpenDialogSync(
            window.electron.remote.getCurrentWindow(),
            {
                title: '选择一个文件',
                properties: ['openFile']
            }
        )
        if (!result) return
        this.userSelectPath = result
    }
    
    hasFileAccessPermission() {
        // 0 拒绝 1 允许 2 仅允许一次
        switch (this.FileAccessPermissionLevel) {
            case (0):
                return false
            case (1):
                return true
            case (2):
                this.FileAccessPermissionLevel=0
                return true
            default:
                return false
        }

    }
}

module.exports = FileIOExtension;