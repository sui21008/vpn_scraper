# VPN SCRAPER
VPNにアップされているファイルの情報を収集するスクリプトです。対象ディレクトリにアップされているファイルのファイル名、拡張子、アップロード日時を取得します。

# 使い方
**クローン**
```
git clone git@bitbucket.org:kenzo_kobayashi/vpn-scraper.git
```

**依存パッケージのインストール**
```
npm install
```

**config.jsonを下記フォーマットでプロジェクトフォルダ直下に用意**
```json
{
    "user_name": "",
    "password": "",
    "target": ""    // share以降のパスを入力(share/AAA/BBBならAAA/BBBと入力)
}
```

**実行**
```
npm run start
```

実行結果はoutput.csvに出力されます。