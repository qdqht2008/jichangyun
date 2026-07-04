# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static website for Clash VPN resources (机场推荐, 使用教程). The site targets Cloudflare Pages and requires no application build step.

## Running Locally

```bash
# Simple static server
python3 -m http.server 8080

# Or using npx
npx serve .
```

Then open http://localhost:8080

## Directory Structure

- `/` - Root with index.html (homepage)
- `index.html` - Main homepage
- `css/main.css` - Global styles with CSS variables (warm light theme)
- `js/` - JavaScript utilities
- `img/` - Images and logos
- `jichang/` - Airport recommendation pages (各机场详情页)
- `tutorial/` - Tutorial pages (使用教程)
- `guide/` - Troubleshooting and reference pages (机场百科)
- `docs/superpowers/` - Project planning docs

## Key Technologies

- HTML5, CSS3 (CSS Variables for theming)
- Bootstrap 4.6, jQuery 3.7, Font Awesome 4.7
- Google Fonts (DM Serif Display, Inter, Noto Sans SC)
- Giscus for comments

## CSS Architecture

All styling uses CSS variables defined in `css/main.css`:
- `--bg-primary`, `--bg-secondary` - Background colors
- `--accent-primary` (#e07a5f), `--accent-secondary` (#81b29a), `--accent-tertiary` (#3d405b)
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--border-color`, `--gradient-warm`

## Page Layout Pattern

Pages use a sidebar + content layout:
- `.pageside` - Sticky sidebar with `.site-nav` navigation
- `.content` - Main article content area
- `.article-header` with `.article-title` for page titles

## Adding New Pages

1. Create HTML file in appropriate directory
2. Use consistent page structure (header, sidebar nav, content, footer)

## Cloudflare Pages Deployment

The site is deployed as static HTML from the repository root. See `docs/cloudflare-pages-deployment.md` for the current project settings and verification checklist.


除非显式覆盖，否则本规则适用于本项目中的所有任务。核心倾向：非琐碎工作，谨慎优先于速度；琐碎任务可自主判断处理。
## 规则一：
先思后码（Think Before Coding）明确声明前提假设。遇不确定处，先提问而非盲目猜测。存在歧义时，列出多种可能的理解路径。若存在更简方案，应果断提出异议。陷入困惑时立即暂停，并明确指出模糊之处。
## 规则二：
简单至上（Simplicity First）仅用最少代码解决问题。杜绝任何“以防万一”的猜测性实现。不实现需求之外的功能。不为仅用一次的代码强行设计抽象。自检：资深工程师是否会认为此实现过度复杂？若是，立即简化。
## 规则三：
外科手术式修改（Surgical Changes）仅改动绝对必要的部分。仅清理自身引入的冗余或错误。切勿“顺手优化”相邻代码、注释或排版格式。未出问题的代码绝不重构。严格贴合项目既有风格。
## 规则四：
目标驱动执行（Goal-Driven Execution）明确定义成功标准（验收条件）。持续迭代直至验证通过。不要死板遵循步骤。定义成功形态并自主迭代。清晰的成功标准赋予你独立闭环执行的能力。
## 规则五：
仅将模型用于判断与裁量场景（Use the model only for judgment calls）适用于我：分类、起草、摘要总结、信息提取。切勿用于：路由分发、重试机制、确定性数据转换。若常规代码能给出答案，就由代码处理。
## 规则七：
显式暴露冲突，拒绝折中调和（Surface conflicts, don't average them）若两种模式相互矛盾，明确择一（优先更新或更经测试的版本）。阐明选择理由。将另一处标记为待清理项。切勿强行融合冲突范式。
## 规则八：
落笔前先阅读（Read before you write）添加代码前，通读该文件的导出接口、直接调用方及公共工具函数。“看似互不干涉”是最危险的判断。若不理解现有代码为何如此设计，先提问。
## 规则九：
测试验证意图，而非仅验证行为（Tests verify intent, not just behavior）测试必须体现该行为*为何重要*（WHY），而非仅断言它*做了什么*（WHAT）。若业务逻辑变更时测试仍不报错，则该测试设计错误。
## 规则十：
关键步骤后强制设立检查点（Checkpoint after every significant step）总结已完成事项、已验证结果及剩余待办。若无法向我清晰描述当前状态，绝不可继续推进。若丢失上下文或逻辑偏离，立即暂停并重新声明当前状态。
## 规则十一：
严格遵从代码库既有规范，即便持保留意见（Match the codebase's conventions, even if you disagree）在代码库内部：规范一致性 > 个人技术偏好。若确信某规范存在实质危害，请显式提出。切勿暗中另起范式。
## 规则十二：
显式失败（Fail loud）若有步骤被静默跳过，宣称“已完成”即为错误。若有测试被跳过，宣称“测试通过”即为错误。默认原则：主动暴露不确定性，绝不掩盖。
## 反馈机制
当发现错误时：
1. 记录错误类型和原因
2. 修复并验证
3. 更新约束文档（如规则有漏洞）
