# Nicoversary!

https://nicoversary.herokuapp.com/

ニコニコ動画の動画では，「〇〇周年記念にまた見に来た」という内容のコメントを見かけます。

特定の日付に投稿された動画を再生数順で調べられたら便利だと思い，作りました。

# 参考イメージ

<img src="./images/readme_image.png" width="640px">

# 使い方

## トップ画面

"/"(ルートパス)にアクセスすると，投稿日が今日の日付の動画を検索し，再生数順に100件表示します。

ただし，重くなりすぎないよう10000再生以上の動画に絞って検索しています。

また，各動画が投稿何周年かがわかるようになっています。

## 日付検索・タグ検索

"1日前"や"1日後"ボタンを押すたびに，検索する日付が変わります。

タグ一覧からタグを選ぶと，特定のタグのついた動画のみに絞って検索できます。

一番上のタイトルロゴをクリックすることで，トップ画面に戻ります。

## さらに高度な検索

検索時のURLを見ると分かるのですが，検索条件を自分で入力することもできます。

- 日付検索は "/2021/5/24/"
- タグ検索は "/VOCALOID"
- 日付かつタグ検索は "/2021/5/24/VOCALOID"

リストに存在しないタグを自分で打ち込んで検索することもできます。

ただし，2026年以降の検索になるとクエリが大きくなりすぎて検索できません。

また，[現存する最古の動画](https://www.nicovideo.jp/watch/sm9)が2007年の動画であるため，2008年よりも前の西暦では検索できなくしてあります。

# 開発環境

主に，以下のような環境で作りました。

- ruby 2.6.3
- sinatra 2.1.0
- slim 4.1.0

また，以下のAPIを使わせていただきました。

ニコニコ動画 『スナップショット検索API v2』

https://site.nicovideo.jp/search-api-docs/snapshot

# License

著作権は放棄しませんが，改良してより高機能なものを作るなどは歓迎します。
