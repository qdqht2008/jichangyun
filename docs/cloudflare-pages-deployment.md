# Cloudflare Pages 部署

本项目是纯静态 HTML/CSS/JavaScript 站点，不需要应用构建、Pages Functions、服务端数据库或运行时环境变量。

## Git 集成设置

在 Cloudflare 控制台进入 **Workers & Pages → Create application → Pages → Import an existing Git repository**，选择本仓库后设置：

| 设置 | 本项目值 |
|---|---|
| Framework preset | None / 无框架 |
| Production branch | `main` |
| Root directory | 留空，使用仓库根目录 |
| Build command | `exit 0` |
| Build output directory | 仓库根目录，即包含顶层 `index.html` 的目录 |
| Environment variables | 无需环境变量 |

Cloudflare 的通用 Git 集成文档允许无构建项目留空 Build command；更具体的 Static HTML 指南建议使用 `exit 0`。本项目采用后者。控制台保存前应确认 Build output directory 解析到仓库根目录，而不是某个不存在的 `dist` 或 `public` 目录。

## 首次部署

1. 确认生产分支为 `main`。
2. 触发第一次部署并等待状态变为成功。
3. 先在分配的 `*.pages.dev` 域名完成下方验证。
4. 在 **Custom domains → Set up a domain** 中添加正式域名。
5. 按 Cloudflare 引导完成 DNS 与证书配置；不要只手工创建 CNAME 而跳过 Pages 自定义域名关联。

## 部署验证

逐项确认返回 200 且内容正确：

- `/` 首页；
- `/jichang/`、`/tutorial/`、`/guide/`；
- 任一深层文章路径；
- `/sitemap.xml`；
- `/robots.txt`；
- `/favicon.ico`；
- `/img/social-share-1200x630.png`。

同时检查 canonical 指向正式域名、移动端无整页横向溢出、浏览器控制台没有本站静态资源 404。

## 预览与回滚

Git 集成会为非生产分支或 Pull Request 创建预览部署。生产发布异常时，进入 **Pages project → Deployments → All deployments**，在目标成功部署的操作菜单中选择 **Rollback to this deployment**。预览部署不能作为回滚目标。

## 评论与环境变量

评论使用客户端 Giscus，不使用 Waline 服务端。本项目当前没有 Pages Functions，也无需数据库或自定义环境变量。

历史 Waline 初始化脚本曾包含明文数据库凭据。删除代码不会清除 Git 历史，也不能使凭据失效；必须在数据库服务商后台撤销并轮换旧凭据。

## 官方资料

- [Cloudflare Pages：Static HTML](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)
- [Cloudflare Pages：Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Cloudflare Pages：Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare Pages：Rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/)
