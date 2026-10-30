"use client";

import { useCallback, useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { CATEGORIES, money, type Category, type MenuItem } from "@/lib/types";

type Flag = "sold_out" | "is_new" | "recommended" | "hidden";

const FLAGS: { key: Flag; label: string; cls: string }[] = [
  { key: "sold_out", label: "售罄", cls: "out" },
  { key: "is_new", label: "新品", cls: "new" },
  { key: "recommended", label: "店长推荐", cls: "rec" },
  { key: "hidden", label: "下架", cls: "" },
];

const toCents = (s: string) => {
  const n = Math.round(parseFloat(s) * 100);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export default function MenuPanel() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await browserClient().from("menu_items").select("*").order("sort");
    if (error) setError("菜单读取失败，请刷新页面。");
    else setItems(data as MenuItem[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function patch(item: MenuItem, change: Partial<MenuItem>) {
    setError("");
    setItems((list) => list.map((x) => (x.id === item.id ? { ...x, ...change } : x)));
    const { error } = await browserClient()
      .from("menu_items")
      .update({ ...change, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    if (error) {
      setError(`${item.name_zh} 没保存成功，请重试。`);
      load();
    } else {
      setSaved(`已保存：${item.name_zh}。网站已同步更新。`);
    }
  }

  return (
    <section>
      <div className="toolbar">
        <span>点开关会立刻生效。售罄的点心顾客点不了；下架的点心不在网站上显示。</span>
        <span style={{ flex: 1 }} />
        <button className="btn small red" onClick={() => setEditing("new")}>+ 新增点心</button>
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      {saved && !error && <p className="meta" role="status" style={{ color: "var(--jade)" }}>{saved}</p>}

      {editing && (
        <ItemEditor
          item={editing === "new" ? null : editing}
          nextSort={(items.at(-1)?.sort ?? 0) + 10}
          onClose={() => setEditing(null)}
          onSaved={(name) => { setEditing(null); setSaved(`已保存：${name}。网站已同步更新。`); load(); }}
        />
      )}

      {CATEGORIES.map((cat) => {
        const list = items.filter((m) => m.category === cat.key);
        if (!list.length) return null;
        return (
          <div key={cat.key} style={{ marginTop: 20 }}>
            <div className="section-head"><h2 style={{ fontSize: 28 }}>{cat.zh}</h2></div>
            {list.map((m) => (
              <div className="mrow" key={m.id}>
                {m.image_url ? <img src={m.image_url} alt="" /> : <div className="noimg" />}
                <div>
                  <div className="nm">{m.name_zh} <span className="sub">{m.name_en}</span></div>
                  <div className="sub">{m.portion} · {money(m.price_cents)}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <label className="sub" htmlFor={`p-${m.id}`}>$</label>
                  <input
                    id={`p-${m.id}`}
                    className="price-in"
                    inputMode="decimal"
                    defaultValue={(m.price_cents / 100).toFixed(2)}
                    key={m.price_cents}
                    onBlur={(e) => {
                      const c = toCents(e.target.value);
                      if (c === null) { e.target.value = (m.price_cents / 100).toFixed(2); return; }
                      if (c !== m.price_cents) patch(m, { price_cents: c });
                    }}
                  />
                </div>
                <div className="toggles">
                  {FLAGS.map((f) => (
                    <button key={f.key} className={`toggle ${f.cls}`} aria-pressed={m[f.key]} onClick={() => patch(m, { [f.key]: !m[f.key] })}>
                      {f.label}
                    </button>
                  ))}
                  <button className="toggle" onClick={() => setEditing(m)}>编辑</button>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </section>
  );
}

function ItemEditor({ item, nextSort, onClose, onSaved }: {
  item: MenuItem | null;
  nextSort: number;
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const [f, setF] = useState({
    category: item?.category ?? ("dimsum" as Category),
    name_zh: item?.name_zh ?? "",
    name_en: item?.name_en ?? "",
    portion: item?.portion ?? "",
    price: item ? (item.price_cents / 100).toFixed(2) : "",
    tagline: item?.tagline ?? "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const price_cents = toCents(f.price);
    if (!f.name_zh.trim()) return setError("请填写中文菜名。");
    if (price_cents === null) return setError("价格要填数字，例如 6.99。");
    setBusy(true);
    setError("");
    const sb = browserClient();
    const id = item?.id ?? `item-${Date.now().toString(36)}`;
    let image_url = item?.image_url ?? null;
    if (file) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${id}-${Date.now()}.${ext}`;
      const up = await sb.storage.from("menu-images").upload(path, file, { contentType: file.type, upsert: true });
      if (up.error) {
        setBusy(false);
        return setError("图片上传失败，换一张小一点的图片试试。");
      }
      image_url = sb.storage.from("menu-images").getPublicUrl(path).data.publicUrl;
    }
    const row = {
      category: f.category, name_zh: f.name_zh.trim(), name_en: f.name_en.trim(), portion: f.portion.trim(),
      price_cents, tagline: f.tagline.trim(), image_url, updated_at: new Date().toISOString(),
    };
    const { error } = item
      ? await sb.from("menu_items").update(row).eq("id", item.id)
      : await sb.from("menu_items").insert({ ...row, id, sort: nextSort, is_new: true });
    setBusy(false);
    if (error) return setError("保存失败，请重试。");
    onSaved(row.name_zh);
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <form className="order-card" onSubmit={save} style={{ marginBottom: 20 }}>
      <h3>{item ? `编辑 ${item.name_zh}` : "新增点心（会自动标为新品）"}</h3>
      <div className="fields">
        <div className="field">
          <label htmlFor="e-cat">分类</label>
          <select id="e-cat" value={f.category} onChange={set("category")}>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.zh}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="e-zh">中文菜名</label><input id="e-zh" value={f.name_zh} onChange={set("name_zh")} placeholder="例如：叉烧包" /></div>
        <div className="field"><label htmlFor="e-en">英文菜名</label><input id="e-en" value={f.name_en} onChange={set("name_en")} placeholder="BBQ Pork Buns" /></div>
        <div className="field"><label htmlFor="e-portion">份量</label><input id="e-portion" value={f.portion} onChange={set("portion")} placeholder="3只 / 3 pcs" /></div>
        <div className="field"><label htmlFor="e-price">价格 $</label><input id="e-price" inputMode="decimal" value={f.price} onChange={set("price")} placeholder="6.99" /></div>
        <div className="field"><label htmlFor="e-tag">一句话卖点</label><input id="e-tag" value={f.tagline} onChange={set("tagline")} placeholder="例如：蜜汁香甜" /></div>
        <div className="field">
          <label htmlFor="e-img">照片{item?.image_url ? "（不选就保留原图）" : ""}</label>
          <input id="e-img" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn red" type="submit" disabled={busy}>{busy ? "保存中…" : "保存"}</button>
        <button className="btn outline" type="button" onClick={onClose}>取消</button>
      </div>
    </form>
  );
}
