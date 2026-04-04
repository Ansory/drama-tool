{
  "name": "drama-tool",
  "version": "1.0.0",
  "description": "Video Generator + Planner Konten Drama China",
  "main": "src/main/main.js",
  "scripts": {
    "start": "electron .",
    "dev": "cross-env NODE_ENV=development electron .",
    "build:win": "electron-builder --win --x64",
    "build:portable": "electron-builder --win portable",
    "postinstall": "electron-builder install-app-deps"
  },
  "author": "Ansory",
  "license": "MIT",
  "devDependencies": {
    "cross-env": "^7.0.3",
    "electron": "^27.0.0",
    "electron-builder": "^24.6.4"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "electron-store": "^8.1.0",
    "ffmpeg-static": "^5.2.0",
    "fluent-ffmpeg": "^2.1.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-dropzone": "^14.2.3",
    "sqlite3": "^5.1.6"
  },
  "build": {
    "appId": "com.dramatool.app",
    "productName": "Drama Tool",
    "directories": {
      "output": "dist"
    },
    "files": [
      "src/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
