# 天才港点 Genius Dim Sum

港式点心 · 经典早茶 · 现蒸现卖。顾客在网站上看菜单、在线预点单，店家在 `/admin` 后台看订单、改菜单。

- 网站：Next.js 15，部署在 Vercel
- 数据：Supabase（菜单、订单、后台登录、菜品照片）

## 页面

| 地址 | 给谁用 | 做什么 |
|---|---|---|
| `/` | 顾客 | 开业宣传、菜单（售罄 / 新品 / 店长推荐标签）、加购、提交预点单、显示 Venmo 和支付宝收款码 |
| `/admin` | 店家 | 登录后看实时订单，标记已付款 / 已取餐 / 取消；改价格、售罄、新品、推荐、下架；新增点心并上传照片 |

## 第一次上线

1. **Supabase**：新建项目 → SQL Editor → 粘贴 [`supabase/schema.sql`](supabase/schema.sql) 全部内容 → Run。这一步会建表、设权限，并写入开业菜单。
2. **后台账号**：Supabase → Authentication → Users → Add user，填你的邮箱和密码（勾选 Auto Confirm）。然后打开网站的 `/admin` 用这个账号登录，页面会给出一句 SQL，复制到 SQL Editor 运行，你就成了管理员。
3. **Vercel**：Add New Project → 选这个 GitHub 仓库 → 在 Environment Variables 里填三项（值在 Supabase → Project Settings → API）：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`（只填在 Vercel，不要提交到代码或发到聊天里）

   然后 Deploy。以后每次合并到 `main`，Vercel 会自动重新部署。

没填 Supabase 变量时网站也能打开，菜单用代码里的开业菜单，点单按钮会提示“私聊小月下单”。

## 改店铺信息

地址、营业时间、客服微信号、Venmo 账号都在 [`lib/site.ts`](lib/site.ts)。收款码图片在 `public/img/pay-venmo.png` 和 `public/img/pay-alipay.png`。

## 安全设计

- 顾客不能直接读写数据库。订单由服务器端 `/api/orders` 按数据库里的价格重新计算后写入，改请求也改不了价格，售罄的点心下不了单。
- 只有 `admins` 表里的账号能看订单、改菜单（Supabase 行级权限）。

## 本地开发

```bash
cp .env.example .env.local   # 填好 Supabase 的值
npm install
npm run dev                  # http://localhost:3000
npm test                     # 订单计价的单元测试
```
