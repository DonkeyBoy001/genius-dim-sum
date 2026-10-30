import OpenStatus from "@/components/OpenStatus";
import OrderMenu from "@/components/OrderMenu";
import PayMethods from "@/components/PayMethods";
import { getMenu } from "@/lib/menu";
import { SITE } from "@/lib/site";
import { stripeConfigured } from "@/lib/stripe";

// Always read the latest menu, so sold-out and price changes show right away.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { menu, live } = await getMenu();
  const orderingOpen = live && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const payOnline = orderingOpen && stripeConfigured;

  return (
    <>
      <header className="bar">
        <div className="wrap">
          <a className="name" href="#top">{SITE.nameZh}</a>
          <span className="spacer" />
          <OpenStatus />
        </div>
      </header>

      <section className="hero" id="top">
        <div className="wrap">
          <div>
            <h1>{SITE.nameZh}</h1>
            <p className="latin">{SITE.nameEn}</p>
            <p className="tagline">{SITE.tagline}</p>
            <div className="ribbon">重磅开业！每天{SITE.opensLabel}起，一笼一笼现蒸</div>
            <p className="pitch">不用跑 Flushing，{SITE.location}就能吃到热气腾腾的港式早茶。虾饺、烧卖、流沙包，深夜也有。</p>
            <div className="actions">
              <a className="btn solid" href="#menu">看菜单 · 在线预点</a>
              <a className="btn ghost" href="#visit">怎么找到我们</a>
            </div>
          </div>
          <img className="logo" src="/img/logo.jpg" alt="天才港点 Logo：戴厨师帽的小厨师端着一笼虾饺" />
        </div>
      </section>

      <main className="wrap" id="menu">
        <OrderMenu menu={menu} orderingOpen={orderingOpen} payOnline={payOnline} />
      </main>

      <section className="visit" id="visit">
        <div className="wrap">
          <div>
            <h4>Location 地点</h4>
            <p className="big">{SITE.location}</p>
          </div>
          <div>
            <h4>Hours 营业时间</h4>
            <p className="big">{SITE.hoursLabel}</p>
            <p>每晚现蒸</p>
          </div>
          <div>
            <h4>Order 点餐</h4>
            <p className="big">网上预点，到店直接取</p>
            <p>选好点心提交订单，{payOnline ? "在线刷卡或扫码付款" : "扫码付款"}，报订单号取餐，不用排队</p>
            <PayMethods />
          </div>
        </div>
      </section>

      <footer className="wrap">
        <p className="motto">{SITE.motto}</p>
        <p className="motto-en">{SITE.mottoEn}</p>
      </footer>
    </>
  );
}
