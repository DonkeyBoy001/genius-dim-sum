# 天才港点 Genius Dim Sum

港式点心 · 经典早茶 · 现蒸现卖。顾客在网站上看菜单、在线预点单，店家在 `/admin` 后台看订单、改菜单。

- 网站：Next.js 15，部署在 Vercel
- 数据：Supabase（菜单、订单、后台登录、菜品照片）

## 页面

| 地址 | 给谁用 | 做什么 |
|---|---|---|
| `/` | 顾客 | 开业宣传、菜单（售罄 / 新品 / 店长推荐标签）、加购、提交预点单，然后在线付款（Stripe：银行卡 / Apple Pay / Google Pay）或扫 Venmo、支付宝收款码 |
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

## 在线付款（Stripe）

顾客下单后点“在线付款”，跳到 Stripe 的付款页（银行卡、Apple Pay、Google Pay），付完回到网站显示“付款成功”。Stripe 通知网站后，订单在 `/admin` 自动变成“已付款”，并带紫色“在线已付”标签。Venmo / 支付宝收款码照旧显示，作为备用。

没填 Stripe 变量时，网站和以前一样只显示收款码。

开通步骤：

1. **Supabase 加字段**：SQL Editor → New query → 粘贴 [`supabase/migrations/002_stripe.sql`](supabase/migrations/002_stripe.sql) → Run。
2. **注册 Stripe**：https://dashboard.stripe.com/register ，按提示填商家和银行卡信息（Activate payments）。没填完之前可以先用测试模式（右上角 Test mode）。
3. **拿密钥**：Developers → API keys → Secret key（`sk_live_…`，测试模式是 `sk_test_…`）。
4. **建 Webhook**：Developers → Webhooks → Add endpoint：
   - Endpoint URL：`https://genius-dim-sum.vercel.app/api/stripe/webhook`
   - Events：`checkout.session.completed`、`checkout.session.async_payment_succeeded`
   - 建好后点进去，复制 Signing secret（`whsec_…`）。
5. **Vercel**：Settings → Environment Variables 加两项，然后 Deployments → 最新一次 → Redeploy：
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

   这两项和 Supabase 的 service role key 一样，只填在 Vercel，不要提交到代码或发到聊天里。
6. **Apple Pay / Google Pay**：Settings → Payment methods，确认 Cards、Apple Pay、Google Pay 是开的（默认就开）。

测试模式和正式模式的密钥、Webhook 是分开的，切换到正式时第 3、4、5 步要用正式模式再做一遍。测试卡号 `4242 4242 4242 4242`，有效期填未来任意日期，CVC 任意。

顾客取消付款或关掉页面，订单还在，状态是“待付款”，可以再点在线付款或扫码。付款页 31 分钟后失效。已在线付款的订单如果被取消，后台会提示去 Stripe 后台退款。

## 改店铺信息

地址、营业时间、客服微信号、Venmo 账号都在 [`lib/site.ts`](lib/site.ts)。收款码图片在 `public/img/pay-venmo.png` 和 `public/img/pay-alipay.png`。

## 安全设计

- 顾客不能直接读写数据库。订单由服务器端 `/api/orders` 按数据库里的价格重新计算后写入，改请求也改不了价格，售罄的点心下不了单。
- 只有 `admins` 表里的账号能看订单、改菜单（Supabase 行级权限）。
- 在线付款金额由服务器按订单里存的价格生成。Webhook 先验证 Stripe 签名，并核对付款金额等于订单总额，才把订单标记为已付款。

## 本地开发

```bash
cp .env.example .env.local   # 填好 Supabase 的值
npm install
npm run dev                  # http://localhost:3000
npm test                     # 订单计价的单元测试
```
