# FANZA Helper v01.00.00 - 設計書/説明書

## 目的
既存のTampermonkeyユーザースクリプト（猿用）はそのまま維持しつつ、
通常のブラウザ拡張機能（フォルダに`manifest.json`を置いて読み込む形式）にも対応する。

## 対象
- **userscript**: `userscript/fanzasagasi.user.js`
- **extension**: `extension/` 以下

## 機能
- FANZA/DMMリンク検出
- 商品ID抽出＆整形
- MissAV / Tktube の存在チェック
- ジャンル表示
- ステータスアイコン表示
- 動的コンテンツ対応（MutationObserver）

## ディレクトリ構成
```
main/
  fanza-helper/
    v01.00.00/
      README.md
      userscript/
        fanzasagasi.user.js
      extension/
        manifest.json
        content.js
        background.js
        style.css
```

## インストール（拡張機能版）
1. Chrome/Edgeで `拡張機能` を開く
2. **デベロッパーモード**をON
3. **「パッケージ化されていない拡張機能を読み込む」** から `extension/` フォルダを選択

## ユーザースクリプト版
- Tampermonkey/Violentmonkeyで `userscript/fanzasagasi.user.js` を読み込む

## 仕組み
- content script がページ内リンクを検出してUIを挿入
- background(service worker) が `fetch` で外部サイトの有無を確認

## 注意
- 検索対象は `dmm.co.jp` を含むリンク
- `missav.ws` と `tktube.com` にアクセスするため `host_permissions` が必要
