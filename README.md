# 优质机场推荐

整理公开机场套餐资料、Clash 客户端教程与故障排查指南。

访问网站：[jichangyun.top](https://www.jichangyun.top/)

本站先帮助读者理解套餐限制、客户端配置和常见故障，再由读者结合自己的网络环境作出选择。

## 机场资料

- [机场套餐、价格与购买限制](https://www.jichangyun.top/jichang/)
- [直连、公网中转与 IEPL/IPLC 核验指南](https://www.jichangyun.top/tutorial/line-selection/)
- [购买机场前的避坑检查](https://www.jichangyun.top/guide/avoid-traps/)

## 客户端教程

- [Clash Verge Rev 下载与配置](https://www.jichangyun.top/tutorial/clash-verge/)
- [FlClash 跨平台使用教程](https://www.jichangyun.top/tutorial/flclash/)
- [Clash Meta for Android 配置教程](https://www.jichangyun.top/tutorial/clash-meta-for-android/)

## 故障排查

- [Clash 连不上或频繁断线](https://www.jichangyun.top/guide/frequent-disconnections/)
- [Clash 订阅更新失败](https://www.jichangyun.top/guide/subscription-update-failed/)
- [Clash 已连接但无法上网](https://www.jichangyun.top/guide/connected-but-no-internet/)

## 内容证据原则

- 套餐、价格、流量和限制来自公开来源，并标注核验日期。
- 线路、节点、解锁和客服等商家描述保留商家归因。
- 公开资料不改写成性能、稳定性或持续可用保证。
- 实际体验可能因地区、运营商、设备和时段变化。
- 商业入口在网站内使用 `sponsored nofollow noopener`，README 不复制具体商家入口或活动信息。

## 项目结构

项目使用 HTML5、CSS 和原生 JavaScript，是无需构建步骤的静态优先 Vercel 网站；仅“流媒体与 AI 地区检测”使用一个无状态 Serverless Function。

```text
jichang/   机场资料与套餐评测
tutorial/  客户端与配置教程
guide/     选购知识与故障排查
css/       全站样式
js/        共享导航与统计脚本
api/       Vercel 无状态检测接口
tests/     确定性站点审计
```

## 本地运行与审计

启动静态服务器：

```bash
python3 -m http.server 8080
```

浏览器访问 `http://localhost:8080`。

运行站点审计：

```bash
node --test tests/site-audit.test.mjs
```

## 部署

生产环境采用 Vercel。静态资源、检测接口和回滚验证见 [Vercel 部署说明](docs/vercel-deployment.md)。

## 贡献边界

提交套餐、客户端版本或规则更新时，请附上公开来源和核验日期。不要提交 `Token`、`Cookie`、账号、订阅地址或其他敏感信息，也不要用无法复现的个人体验替代来源。
