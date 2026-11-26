"use client";

import { useActionState, useMemo, useState } from "react";
import type { Product } from "@/db/schema";
import { productBoxHtml } from "@/lib/products";
import { saveProduct, type ProductState } from "../products/actions";
import { MediaModal } from "./media-modal";
import { wpDate } from "./ui";

type Draft = {
  name: string; slug: string; url: string; merchant: string; image: string; imageAlt: string; price: string;
  rating: string; badge: string; description: string; pros: string; cons: string; buttonText: string;
};

export function ProductForm({ product, defaultButton, newTab, message }: { product?: Product; defaultButton: string; newTab: boolean; message?: string }) {
  const [state, action, pending] = useActionState<ProductState, FormData>(saveProduct, {});
  const [d, setD] = useState<Draft>({
    name: product?.name ?? "", slug: product?.slug ?? "", url: product?.url ?? "", merchant: product?.merchant ?? "",
    image: product?.image ?? "", imageAlt: product?.imageAlt ?? "", price: product?.price ?? "", rating: product?.rating ?? "",
    badge: product?.badge ?? "", description: product?.description ?? "", pros: product?.pros ?? "", cons: product?.cons ?? "",
    buttonText: product?.buttonText ?? "",
  });
  const [picking, setPicking] = useState(false);
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD({ ...d, [k]: e.target.value });

  const preview = useMemo(
    () =>
      productBoxHtml(
        {
          id: 0, clicks: 0, createdAt: new Date(), updatedAt: new Date(),
          slug: d.slug || "preview", name: d.name || "Product name", url: d.url || "#",
          merchant: d.merchant || null, image: d.image || null, imageAlt: d.imageAlt || null, price: d.price || null,
          rating: d.rating || null, badge: d.badge || null, description: d.description || null, pros: d.pros || null,
          cons: d.cons || null, buttonText: d.buttonText || null,
        },
        { newTab, buttonText: defaultButton },
      ),
    [d, newTab, defaultButton],
  );
  const shortcode = `[product id="${product?.slug ?? (d.slug || "…")}"]`;
  const notice = state.error ? null : state.saved ? "Product updated." : message;

  return (
    <form action={action}>
      {product && <input type="hidden" name="id" value={product.id} />}
      {state.error && <div className="wp-notice error"><p>{state.error}</p></div>}
      {notice && <div className="wp-notice"><p>{notice}</p></div>}
      <div className="editor-layout">
        <div>
          <div className="titlediv">
            <label className="sr-only" htmlFor="title">Product name</label>
            <input id="title" name="name" type="text" placeholder="Product name" value={d.name} onChange={set("name")} required
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} />
          </div>

          <div className="postbox">
            <div className="postbox-header"><h2>Affiliate Link</h2></div>
            <div className="inside">
              <table className="form-table" role="presentation">
                <tbody>
                  <tr>
                    <th scope="row"><label htmlFor="url">Destination URL</label></th>
                    <td>
                      <input id="url" name="url" type="url" required className="large-text" placeholder="https://www.amazon.com/dp/…?tag=yourtag-20" value={d.url} onChange={set("url")} />
                      <p className="description">The full affiliate link, including your tracking tag.</p>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row"><label htmlFor="slug">Link slug</label></th>
                    <td>
                      <code>/go/</code><input id="slug" name="slug" type="text" value={d.slug} onChange={set("slug")} placeholder="made from the name" style={{ width: 240 }} /><code>/</code>
                      <p className="description">Visitors click <code>{`/go/${d.slug || "product-name"}/`}</code>, which counts the click and forwards them. Changing it updates every post that uses this product.</p>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row"><label htmlFor="merchant">Store</label></th>
                    <td><input id="merchant" name="merchant" type="text" className="regular-text" placeholder="Amazon, REI, Backcountry…" value={d.merchant} onChange={set("merchant")} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="postbox">
            <div className="postbox-header"><h2>Product Box Content</h2></div>
            <div className="inside">
              <label style={{ display: "block", marginBottom: 12 }}>
                <span style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Short description</span>
                <textarea name="description" rows={3} style={{ width: "100%" }} value={d.description} onChange={set("description")} placeholder="One or two sentences on who it's for." />
              </label>
              <div className="two-col">
                <label>
                  <span style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Pros <span style={{ fontWeight: 400, color: "#646970" }}>(one per line)</span></span>
                  <textarea name="pros" rows={5} style={{ width: "100%" }} value={d.pros} onChange={set("pros")} />
                </label>
                <label>
                  <span style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Cons <span style={{ fontWeight: 400, color: "#646970" }}>(one per line)</span></span>
                  <textarea name="cons" rows={5} style={{ width: "100%" }} value={d.cons} onChange={set("cons")} />
                </label>
              </div>
            </div>
          </div>

          <div className="postbox">
            <div className="postbox-header"><h2>Preview</h2></div>
            <div className="inside" style={{ background: "#fbfaf7" }}>
              <div style={{ maxWidth: 720, margin: "0 auto", fontFamily: "var(--font-inter), system-ui, sans-serif" }} dangerouslySetInnerHTML={{ __html: preview }} />
            </div>
          </div>
        </div>

        {/* ---------- Sidebar ---------- */}
        <div>
          <div className="postbox" id="submitdiv">
            <div className="postbox-header"><h2>Publish</h2></div>
            <div className="inside">
              {product ? (
                <>
                  <p style={{ margin: "0 0 6px" }}>Clicks: <strong>{product.clicks.toLocaleString()}</strong></p>
                  <p style={{ margin: 0, color: "#646970" }}>Last modified {wpDate(product.updatedAt)}</p>
                </>
              ) : (
                <p style={{ margin: 0, color: "#646970" }}>Publish the product, then add it to posts from the editor.</p>
              )}
            </div>
            <div className="major-publishing-actions" style={{ justifyContent: "flex-end" }}>
              <button className="wp-btn wp-btn-primary" disabled={pending}>{pending ? "Saving…" : product ? "Update" : "Publish"}</button>
            </div>
          </div>

          <div className="postbox">
            <div className="postbox-header"><h2>Shortcode</h2></div>
            <div className="inside">
              <input type="text" readOnly value={shortcode} onFocus={(e) => e.target.select()} style={{ width: "100%", fontFamily: "monospace" }} aria-label="Shortcode" />
              <p className="description" style={{ marginBottom: 0 }}>Paste into any post, or use <strong>Add Product</strong> in the editor. For a comparison table use <code>{`[products ids="a,b,c"]`}</code>.</p>
            </div>
          </div>

          <div className="postbox">
            <div className="postbox-header"><h2>Product Details</h2></div>
            <div className="inside" style={{ display: "grid", gap: 10 }}>
              <label><span className="field-label">Price</span><input name="price" type="text" style={{ width: "100%" }} placeholder="$89.95" value={d.price} onChange={set("price")} /></label>
              <label><span className="field-label">Rating (0-5)</span><input name="rating" type="number" min={0} max={5} step={0.1} style={{ width: "100%" }} value={d.rating} onChange={set("rating")} /></label>
              <label><span className="field-label">Badge</span><input name="badge" type="text" style={{ width: "100%" }} placeholder="Best Overall" value={d.badge} onChange={set("badge")} /></label>
              <label><span className="field-label">Button text</span><input name="buttonText" type="text" style={{ width: "100%" }} placeholder={defaultButton} value={d.buttonText} onChange={set("buttonText")} /></label>
            </div>
          </div>

          <div className="postbox">
            <div className="postbox-header"><h2>Product image</h2></div>
            <div className="inside">
              <input type="hidden" name="image" value={d.image} />
              {d.image ? (
                <>
                  <button type="button" onClick={() => setPicking(true)} style={{ display: "block", width: "100%", padding: 0, border: 0, background: "none" }} aria-label="Replace product image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.image} alt="" style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain" }} />
                  </button>
                  <label style={{ display: "block", marginTop: 8 }}>
                    <span className="field-label">Alt text</span>
                    <input name="imageAlt" type="text" style={{ width: "100%" }} value={d.imageAlt} onChange={set("imageAlt")} placeholder={d.name} />
                  </label>
                  <p style={{ margin: "8px 0 0" }}>
                    <button type="button" className="button-link" onClick={() => setD({ ...d, image: "", imageAlt: "" })} style={{ color: "#b32d2e" }}>Remove product image</button>
                  </p>
                </>
              ) : (
                <>
                  <button type="button" className="button-link" onClick={() => setPicking(true)}>Set product image</button>
                  <label style={{ display: "block", marginTop: 10 }}>
                    <span className="field-label">…or paste an image URL</span>
                    <input type="url" style={{ width: "100%" }} placeholder="https://" onBlur={(e) => e.target.value && setD({ ...d, image: e.target.value.trim() })} />
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {picking && (
        <MediaModal
          title="Product image"
          button="Set product image"
          onClose={() => setPicking(false)}
          onSelect={(m) => {
            setD({ ...d, image: m.url, imageAlt: d.imageAlt || m.alt || "" });
            setPicking(false);
          }}
        />
      )}
    </form>
  );
}
