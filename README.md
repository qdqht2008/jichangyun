# 优质机场推荐

整理公开机场套餐资料、Clash 客户端教程与故障排查指南。

访问网站：[vpngate.shop](https://vpngate.shop/)

本站先帮助读者理解套餐限制、客户端配置和常见故障，再由读者结合自己的网络环境作出选择。

## 机场资料

- [机场套餐、价格与购买限制](https://vpngate.shop/jichang/)
- [直连、公网中转与 IEPL/IPLC 核验指南](https://vpngate.shop/tutorial/line-selection/)
- [购买机场前的避坑检查](https://vpngate.shop/guide/avoid-traps/)

## 客户端教程

- [Clash Verge Rev 下载与配置](https://vpngate.shop/tutorial/clash-verge/)
- [FlClash 跨平台使用教程](https://vpngate.shop/tutorial/flclash/)
- [Clash Meta for Android 配置教程](https://vpngate.shop/tutorial/clash-meta-for-android/)

## 故障排查

- [Clash 连不上或频繁断线](https://vpngate.shop/guide/frequent-disconnections/)
- [Clash 订阅更新失败](https://vpngate.shop/guide/subscription-update-failed/)
- [Clash 已连接但无法上网](https://vpngate.shop/guide/connected-but-no-internet/)

## 内容证据原则

- 套餐、价格、流量和限制来自公开来源，并标注核验日期。
- 线路、节点、解锁和客服等商家描述保留商家归因。
- 公开资料不改写成性能、稳定性或持续可用保证。
- 实际体验可能因地区、运营商、设备和时段变化。
- 商业入口在网站内使用 `sponsored nofollow noopener`，README 不复制具体商家入口或活动信息。

## 项目结构

项目使用 HTML5、CSS 和原生 JavaScript，是无需构建步骤的静态优先 Cloudflare Pages 网站；仅“流媒体与 AI 地区检测”使用一个无状态 Pages Function。

```text
jichang/   机场资料与套餐评测
tutorial/  客户端与配置教程
guide/     选购知识与故障排查
css/       全站样式
js/        共享导航与统计脚本
functions/ Cloudflare Pages 无状态检测接口
tests/     确定性站点审计
```

## 本地运行与审计

启动静态服务器：

```bash
python3 -m http.server 8080
```

浏览器访问 `http://localhost:8080`。

需要连同检测接口一起运行时使用：

```bash
npx wrangler pages dev . --port 8002
```

运行站点审计：

```bash
node --test tests/site-audit.test.mjs
```

## 部署

生产环境采用 Cloudflare Pages。静态资源、检测接口和回滚验证见 [Cloudflare Pages 部署说明](docs/cloudflare-pages-deployment.md)。

## 贡献边界

提交套餐、客户端版本或规则更新时，请附上公开来源和核验日期。不要提交 `Token`、`Cookie`、账号、订阅地址或其他敏感信息，也不要用无法复现的个人体验替代来源。
