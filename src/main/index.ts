import { app, shell, BrowserWindow } from 'electron'
import * as path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    minWidth: 960,
    height: 720,
    minHeight: 540,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux'
      ? {
          icon: path.join(__dirname, '../../build/logo.png')
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  //加载用于开发的远程URL或用于生产的本地html文件。
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

//这个方法将在Electron完成时被调用
//初始化，并准备创建浏览器窗口。
//某些api只能在此事件发生后使用。
app.whenReady().then(() => {
  // 设置windows应用的用户模型id
  electronApp.setAppUserModelId('com.electron')

  //在开发中默认使用F12打开或关闭DevTools
  //忽略生产环境中的CommandOrControl + R。
  //见https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    //在macOS上，通常会在应用程序中重新创建一个窗口
    //单击dock图标，没有其他窗口打开。
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
//当所有窗口都关闭时退出，除了macOS。在那里，这很常见
//让应用程序及其菜单栏保持活动状态，直到用户退出
//显式地使用Cmd + Q。
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
