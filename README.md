# cerke_online_backend

## What this is / これはなに
A backend server for https://github.com/jurliyuuri/cerke_online_alpha. / https://github.com/jurliyuuri/cerke_online_alpha のバックエンド。

Requires you to set `DISCORD_NOTIFIER_TOKEN` in the env var for the discord notifier to work. / Discord への通知を飛ばすには `DISCORD_NOTIFIER_TOKEN` が環境変数にセットされている必要がある。

## Running Locally / ローカルで実行方法

```sh
$ npm install
$ npm run build
$ npm start
```

should now be listening on localhost:23564. / としてやると localhost:23564 で listen されるはずである。

## To compile index.ts / index.ts をコンパイルするには

```sh
$ npm install
$ tsc
```
