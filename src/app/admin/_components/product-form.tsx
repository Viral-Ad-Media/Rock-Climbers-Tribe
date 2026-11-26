"use client";

import { useActionState, useMemo, useState } from "react";
import type { Product } from "@/db/schema";
import { parseBoxDesign, type BoxDesign } from "@/lib/products";
import { saveProduct, type ProductState } from "../products/actions";
import { BoxDesignControls, BoxPreview } from "./box-design";
import { MediaModal } from "./media-modal";
import { wpDate } from "./ui";

type Draft = {
  name: string; slug: string; url: string; merchant: string; image: string; imageAlt: string; price: string;
  rating: string; badge: string; description: string; pros: string; cons: string; buttonText: string;
};

export function ProductForm({
  product,
  defaultButton,
  newTab,
  siteDesign,
  message,
}: {
  product?: Product;
  defaultButton: string;
  newTab: boolean;
  siteDesign: BoxDesign;
  message?: string;
}) {
  const [state, action, pending] = useActionState<ProductState, FormData>(saveProduct, {});
  const [d, setD] = useState<Draft>({
    name: product?.name ?? "", slug: product?.slug ?? "", url: product?.url ?? "", merchant: product?.merchant ?? "",
    image: product?.image ?? "", imageAlt: product?.imageAlt ?? "", price: product?.price ?? "", rating: product?.rating ?? "",
    badge: product?.badge ?? "", description: product?.description ?? "", pros: product?.pros ?? "", cons: product?.cons ?? "",
    buttonText: product?.buttonText ?? "",
  });
  const [picking, setPicking] = useState<null | "upload" | "library">(null);
  const [ownDesign, setOwnDesign] = useState(!!product?.design);
  const [design, setDesign] = useState(() => parseBoxDesign(product?.design, siteDesign));
  const shownDesign = ownDesign ? design : siteDesign;
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD({ ...d, [k]: e.target.value });

  const previewProduct = useMemo<Product>(
    () => ({
      id: 0, clicks: 0, createdAt: new Date(0), updatedAt: new Date(0), design: null,
      slug: d.slug || "preview", name: d.name || "Product name", url: d.url || "#",
      merchant: d.merchant || null, image: d.image || null, imageAlt: d.imageAlt || null, price: d.price || null,
      rating: d.rating || null, badge: d.badge || null, description: d.description || null, pros: d.pros || null,
      cons: d.cons || null, buttonText: d.buttonText || null,
    }),
    [d],
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
            <div className="postbox-header"><h2>Box Design</h2></div>
            <div className="inside">
              <input type="hidden" name="design" value={ownDesign ? JSON.stringify(design) : ""} />
              <label className="check-row" style={{ marginBottom: 12 }}>
                <input type="checkbox" checked={!ownDesign} onChange={(e) => setOwnDesign(!e.target.checked)} /> Use the site-wide design from{" "}
                <a href="/admin/settings/affiliates/" target="_blank">Settings → Affiliate Links</a>
              </label>
              <div className="design-split">
                <div>
                  {ownDesign ? (
                    <BoxDesignControls value={design} onChange={setDesign} />
                  ) : (
                    <p className="description" style={{ marginTop: 0 }}>
                      This product follows the site-wide design, so changing that design updates every product box at once. Untick the box above to give this product its own layout, colors and button style.
                    </p>
                  )}
                </div>
                <BoxPreview product={previewProduct} design={shownDesign} buttonText={defaultButton} newTab={newTab} sticky />
              </div>
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
            <div className="postbox-header"><h2>Product image</h2></div>
            <div className="inside">
              <input type="hidden" name="image" value={d.image} />
              {d.image ? (
                <>
                  <button type="button" onClick={() => setPicking("library")} className="image-pick has-image" aria-label="Replace product image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.image} alt="" />
                  </button>
                  <p className="description" style={{ margin: "6px 0 0" }}>Click the image to replace it.</p>
                  <label style={{ display: "block", marginTop: 8 }}>
                    <span className="field-label">Alt text</span>
                    <input name="imageAlt" type="text" style={{ width: "100%" }} value={d.imageAlt} onChange={set("imageAlt")} placeholder={d.name} />
                  </label>
                  <p style={{ margin: "8px 0 0", display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button type="button" className="button-link" onClick={() => setPicking("upload")}>Upload a new image</button>
                    <button type="button" className="button-link" onClick={() => setD({ ...d, image: "", imageAlt: "" })} style={{ color: "#b32d2e" }}>Remove product image</button>
                  </p>
                </>
              ) : (
                <>
                  <button type="button" className="image-pick" onClick={() => setPicking("upload")}>
                    <span className="dashicons-upload" aria-hidden="true">⬆</span>
                    <strong>Upload product image</strong>
                    <span>JPG, PNG or WebP, up to 4 MB</span>
                  </button>
                  <p style={{ margin: "8px 0 0" }}>
                    <button type="button" className="button-link" onClick={() => setPicking("library")}>Choose from Media Library</button>
                  </p>
                  <label style={{ display: "block", marginTop: 10 }}>
                    <span className="field-label">…or paste an image URL</span>
                    <input type="url" style={{ width: "100%" }} placeholder="https://" onBlur={(e) => e.target.value && setD({ ...d, image: e.target.value.trim() })} />
                  </label>
                </>
              )}
              <p className="description" style={{ margin: "10px 0 0" }}>
                {shownDesign.imageLink ? (
                  <>The image links to <code>{`/go/${d.slug || "product-name"}/`}</code>, the same affiliate link as the button.</>
                ) : (
                  <>The image is not clickable. Turn on &ldquo;Clicking the image opens the product link&rdquo; under Box Design to link it.</>
                )}
              </p>
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

        </div>
      </div>
      {picking && (
        <MediaModal
          title="Product image"
          button="Set product image"
          initialTab={picking}
          onClose={() => setPicking(null)}
          onSelect={(m) => {
            setD({ ...d, image: m.url, imageAlt: d.imageAlt || m.alt || "" });
            setPicking(null);
          }}
        />
      )}
    </form>
  );
}
