const { Extension, type, api } = require('clipcc-extension');
let status = 'loading';
let remote = null;
let fs = null;
initialize();

function initialize() {
    try {
        // Electron 15 removed the support of remote.
        // So If the user is using electron 14 or lower, we will use the old remote.
        remote = require('@electron/remote');
        if (!remote) remote = require('electron').remote;
        if (!remote || !fs) {
            status = 'error';
            return;
        }
        status = 'ready';
    } catch (e) {
        status = 'error';
    }
}
class FileIOExtension extends Extension {
    onInit() {
        if (status !== 'ready') {
            alert('electron is not exist in this environment, Please use desktop version instead.')
            throw new Error('electron is not exist in this environment, Please use desktop version instead.')
        }

        this.FileAccessPermissionLevel = 0
        this.fileContent = ''
        this.userSelectPath = ''

        api.addCategory({
            categoryId: 'fileio.category',
            messageId: 'fileio.category.name',
            color: '#339900'
        })

        // 申请文件管理权限
        api.addBlock({
            opcode: 'fileio.blocks.applyforfilemanagement',
            type: type.BlockType.COMMAND,
            messageId: 'fileio.blocks.applyforfilemanagement.message',
            categoryId: 'fileio.category',
            function: () => this.applyForFileManagement()
        })
        // 还回文件管理权限
        api.addBlock({
            opcode: 'fileio.blocks.revokefilemanagement',
            type: type.BlockType.COMMAND,
            messageId: 'fileio.blocks.revokefilemanagement.message',
            categoryId: 'fileio.category',
            function: () => this.revokeFileManagement()
        })
        // 是否拥有外部权限
        api.addBlock({
            opcode: 'fileio.blocks.hasfilemanagement',
            type: type.BlockType.BOOLEAN,
            messageId: 'fileio.blocks.hasfilemanagement.message',
            categoryId: 'fileio.category',
            function: () => this.hasFileManagement()
        })
        // 从[PATH]异步获取文件内容
        api.addBlock({
            opcode: 'fileio.blocks.openfileasync',
            type: type.BlockType.COMMAND,
            messageId: 'fileio.blocks.openfileasync.message',
            categoryId: 'fileio.category',
            param: {
                PATH: {
                    type: type.ParameterType.STRING,
                    default: 'ClipCC.txt'
                }
            },
            function: args => this.openFileAsync(args.PATH)
        })
        // 从[PATH]同步获取文件内容
        api.addBlock({
            opcode: 'fileio.blocks.openfilesync',
            type: type.BlockType.REPORTER,
            messageId: 'fileio.blocks.openfilesync.message',
            categoryId: 'fileio.category',
            param: {
                PATH: {
                    type: type.ParameterType.STRING,
                    default: 'ClipCC.txt'
                }
            },
            function: args => this.openFileSync(args.PATH)
        })
        // 创建文件[PATH]
        api.addBlock({
            opcode: 'fileio.blocks.createfile',
            type: type.BlockType.COMMAND,
            messageId: 'fileio.blocks.createfile.message',
            categoryId: 'fileio.category',
            param: {
                PATH: {
                    type: type.ParameterType.STRING,
                    default: 'ClipCC.txt'
                }
            },
            function: args => this.createFile(args.PATH)
        })
        // 写入文件[PATH]内容为[CONTENT]
        api.addBlock({
            opcode: 'fileio.blocks.writefile',
            type: type.BlockType.COMMAND,
            messageId: 'fileio.blocks.writefile.message',
            categoryId: 'fileio.category',
            param: {
                PATH: {
                    type: type.ParameterType.STRING,
                    default: 'ClipCC.txt'
                },
                CONTENT: {
                    type: type.ParameterType.STRING,
                    default: 'ClipCC Yes!'
                }
            },
            function: args => this.writeFile(args.PATH,args.CONTENT)
        })
        // 删除文件[PATH]
        api.addBlock({
            opcode: 'fileio.blocks.deletefile',
            type: type.BlockType.COMMAND,
            messageId: 'fileio.blocks.deletefile.message',
            categoryId: 'fileio.category',
            param: {
                PATH: {
                    type: type.ParameterType.STRING,
                    default: 'ClipCC.txt'
                }
            },
            function: args => this.deleteFile(args.PATH)
        })
        // 文件内容
        api.addBlock({
            opcode: 'fileio.blocks.filecontent',
            type: type.BlockType.REPORTER,
            messageId: 'fileio.blocks.filecontent.message',
            categoryId: 'fileio.category',
            function: () => this.fileContent
        })
        // 文件[PATH]是否存在？
        api.addBlock({
            opcode: 'fileio.blocks.fileexists',
            type: type.BlockType.BOOLEAN,
            messageId: 'fileio.blocks.fileexists.message',
            categoryId: 'fileio.category',
            param: {
                PATH: {
                    type: type.ParameterType.STRING,
                    default: 'ClipCC.txt'
                },
            },
            function: args => this.fileExists(args.PATH)
        })
        // 从文件选择器选取文件
        api.addBlock({
            opcode: 'fileio.blocks.selectfile',
            type: type.BlockType.COMMAND,
            messageId: 'fileio.blocks.selectfile.message',
            categoryId: 'fileio.category',
            function: () => this.selectFile()
        })
        // 用户选择的文件路径
        api.addBlock({
            opcode: 'fileio.blocks.userselectpath',
            type: type.BlockType.REPORTER,
            messageId: 'fileio.blocks.userselectpath.message',
            categoryId: 'fileio.category',
            function: () => this.userSelectPath
        })
    }

    onUnit() {
        api.removeCategory('fileio.category');
    }

    applyForFileManagement() {
        if (this.permissionDialogTime > Date.now() + 300000) return
        this.permissionDialogTime = Date.now()
        this.FileAccessPermissionLevel = remote.dialog.showMessageBoxSync(
            remote.getCurrentWindow(),
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
        this.FileAccessPermissionLevel = 0;
    }

    hasFileManagement() {
        return !!this.FileAccessPermissionLevel
    }
    
    openFileSync(PATH) {
        if (!this.hasFileAccessPermission()) return '*ERROR: NO PERMISSON!'
        let file
        try {
            file = fs.readFileSync(PATH)
        } catch  {
            return '*ERROR: FILE NOT FOUNT!'
        }
        return file.toString()
        
    }

    openFileAsync(PATH) {
        if (!this.hasFileAccessPermission()) {
            this.fileContent = '*ERROR: NO PERMISSON!'
            return
        } 
        fs.readFile(PATH, (err,data) => {
            if (err) {
                this.fileContent = '*ERROR: '+err.toString()
            } else {
                this.fileContent = data.toString()
            }
        })       
    }

    fileExists(PATH) {
        if (!this.hasFileAccessPermission()) return false
        return fs.existsSync(PATH)
    }

    createFile(PATH) {
        if (!this.hasFileAccessPermission()) return
        try {
            fs.writeFileSync(PATH,'')
        } catch {}
    }

    writeFile(PATH,CONTENT) {
        if (!this.hasFileAccessPermission()) return
        try {
            fs.writeFileSync(PATH,CONTENT)
        } catch {}
    }

    deleteFile(PATH) {
        if (!this.hasFileAccessPermission()) return
        try {
            fs.rmSync(PATH)
        } catch {}
    }
    
    selectFile() {
        if (!this.hasFileAccessPermission()) return
        this.userSelectPath = ''
        const result = remote.dialog.showOpenDialogSync(
            remote.getCurrentWindow(),
            {
                title: '选择一个文件',
                properties: ['openFile']
            }
        )
        if (!result) return
        this.userSelectPath = result[0]
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