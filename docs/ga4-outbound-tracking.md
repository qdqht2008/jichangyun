# GA4 外链点击统计

网站通过共享的 `js/nav.js` 上报隐私最小化的外链点击事件。实现不阻止或延迟跳转，也不会在 GA4 未加载时影响链接使用。

## 事件约定

事件名为 `outbound_link`，只发送以下三个参数：

| 参数 | 内容 |
| --- | --- |
| `link_domain` | 目标主机名，小写并移除开头的 `www.` |
| `link_type` | `sponsored`、`official` 或 `external` |
| `page_path` | 当前页面路径，不含查询参数和锚点 |

分类优先级如下：

1. 链接的 `rel` 包含 `sponsored` 时记为 `sponsored`。
2. 链接位于 `.official-download`、`.tutorial-sources` 或 `.troubleshooting-sources` 时记为 `official`。
3. 其余站外 HTTP(S) 链接记为 `external`。

本站域名、相对链接以及非 HTTP(S) 地址不发送事件。

## 隐私边界

自定义事件不发送完整 URL、查询参数、推广码、链接文字或锚点，也不发送 GA4 自动外链事件使用的 `link_url`。推广链接中的邀请码因此不会进入这个自定义事件的参数。

## 部署前的 GA4 管理端配置

部署前必须在 GA4 管理端关闭 Enhanced Measurement 中的 **Outbound clicks**：

1. 进入对应媒体资源的网页数据流。
2. 打开 Enhanced Measurement 设置。
3. 关闭 Outbound clicks，并保存设置。

这一步不能由仓库代码代替。若保留该开关，GA4 仍会自动发送名为 `click` 的外链事件及完整 `link_url`，既突破上述隐私边界，也会与 `outbound_link` 重复计数。

官方参考：

- [GA4 Enhanced Measurement 事件](https://support.google.com/analytics/answer/9216061)
- [Google tag 事件参考](https://developers.google.com/tag-platform/gtagjs/reference/events)

## 发布后验证

1. 在 GA4 DebugView 中点击一个普通外链、官方资料链接和商业链接。
2. 确认只出现自定义 `outbound_link`，并核对三个参数及分类。
3. 确认没有自动 `click` 外链事件，且参数中没有完整 URL、查询参数、推广码或链接文字。
4. 确认链接立即正常打开，站内链接与 `mailto:`、`tel:` 等地址不产生事件。

本轮只提供代码与配置说明，不操作 GA4 管理端，也不执行部署。
