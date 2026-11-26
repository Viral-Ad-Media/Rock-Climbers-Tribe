"use client";

import type { Product } from "@/db/schema";
import { productBoxHtml, type BoxDesign } from "@/lib/products";

type Opt<T extends string> = { value: T; label: string };

function Segmented<T extends string>({ name, value, options, onChange, disabled }: { name: string; value: T; options: Opt<T>[]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? "active" : ""} disabled={disabled} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="color-field">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />
      <span>
        <span className="field-label" style={{ margin: 0 }}>{label}</span>
        <code>{value}</code>
      </span>
    </label>
  );
}

/** Small diagrams for the three layouts, so the choice is visual like a page builder */
function LayoutIcon({ kind }: { kind: BoxDesign["layout"] }) {
  const box = "#c3c4c7";
  const img = "#8c8f94";
  return (
    <svg viewBox="0 0 64 40" width="64" height="40" aria-hidden="true">
      <rect x="1" y="1" width="62" height="38" rx="4" fill="#fff" stroke={box} />
      {kind === "side" && (
        <>
          <rect x="6" y="6" width="20" height="20" rx="2" fill={img} />
          <rect x="31" y="8" width="26" height="4" rx="1" fill={box} />
          <rect x="31" y="15" width="20" height="3" rx="1" fill={box} />
          <rect x="31" y="27" width="16" height="6" rx="3" fill="#d9622b" />
        </>
      )}
      {kind === "stacked" && (
        <>
          <rect x="6" y="5" width="52" height="13" rx="2" fill={img} />
          <rect x="6" y="22" width="30" height="4" rx="1" fill={box} />
          <rect x="6" y="29" width="18" height="6" rx="3" fill="#d9622b" />
        </>
      )}
      {kind === "compact" && (
        <>
          <rect x="6" y="12" width="14" height="14" rx="2" fill={img} />
          <rect x="24" y="14" width="18" height="4" rx="1" fill={box} />
          <rect x="24" y="21" width="12" height="3" rx="1" fill={box} />
          <rect x="45" y="15" width="14" height="8" rx="4" fill="#d9622b" />
        </>
      )}
    </svg>
  );
}

export function BoxDesignControls({ value, onChange }: { value: BoxDesign; onChange: (d: BoxDesign) => void }) {
  const set = <K extends keyof BoxDesign>(k: K, v: BoxDesign[K]) => onChange({ ...value, [k]: v });
  const check = (k: "imageLink" | "buttonFullWidth" | "shadow" | "showRating" | "showDescription" | "showProsCons" | "showPrice" | "showMerchant", label: string) => (
    <label className="check-row">
      <input type="checkbox" checked={value[k]} onChange={(e) => set(k, e.target.checked)} /> {label}
    </label>
  );
  return (
    <div className="box-design">
      <fieldset>
        <legend>Layout</legend>
        <div className="layout-cards">
          {(
            [
              ["side", "Image beside text"],
              ["stacked", "Image on top"],
              ["compact", "Compact row"],
            ] as const
          ).map(([k, label]) => (
            <button key={k} type="button" aria-pressed={value.layout === k} className={value.layout === k ? "active" : ""} onClick={() => set("layout", k)}>
              <LayoutIcon kind={k} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Image</legend>
        <div className="design-grid">
          <div>
            <span className="field-label">Position</span>
            <Segmented name="Image position" value={value.imagePosition} disabled={value.layout === "stacked"} onChange={(v) => set("imagePosition", v)} options={[{ value: "left", label: "Left" }, { value: "right", label: "Right" }]} />
          </div>
          <div>
            <span className="field-label">Size</span>
            <Segmented name="Image size" value={value.imageSize} onChange={(v) => set("imageSize", v)} options={[{ value: "small", label: "Small" }, { value: "medium", label: "Medium" }, { value: "large", label: "Large" }]} />
          </div>
        </div>
        {check("imageLink", "Clicking the image opens the product link")}
      </fieldset>

      <fieldset>
        <legend>Colors</legend>
        <div className="design-grid">
          <ColorField label="Button" value={value.accent} onChange={(v) => set("accent", v)} />
          <ColorField label="Badge" value={value.badgeColor} onChange={(v) => set("badgeColor", v)} />
          <ColorField label="Background" value={value.background} onChange={(v) => set("background", v)} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Button and frame</legend>
        <div className="design-grid">
          <div>
            <span className="field-label">Button shape</span>
            <Segmented name="Button shape" value={value.buttonStyle} onChange={(v) => set("buttonStyle", v)} options={[{ value: "pill", label: "Pill" }, { value: "rounded", label: "Rounded" }, { value: "square", label: "Square" }]} />
          </div>
          <div>
            <span className="field-label">Border</span>
            <Segmented name="Border" value={value.border} onChange={(v) => set("border", v)} options={[{ value: "subtle", label: "Subtle" }, { value: "accent", label: "Button color" }, { value: "none", label: "None" }]} />
          </div>
        </div>
        {check("buttonFullWidth", "Full-width button")}
        {check("shadow", "Drop shadow")}
      </fieldset>

      <fieldset>
        <legend>Show</legend>
        <div className="check-columns">
          {check("showRating", "Star rating")}
          {check("showDescription", "Description")}
          {check("showProsCons", "Pros and cons")}
          {check("showPrice", "Price")}
          {check("showMerchant", "Store name on button")}
        </div>
      </fieldset>
    </div>
  );
}

export const SAMPLE_PRODUCT: Product = {
  id: 0,
  slug: "sample",
  name: "La Sportiva Solution Comp",
  url: "#",
  merchant: "Amazon",
  image: "/wp-content/uploads/2023/01/Butora-Acro-Climbing-Shoe.jpg",
  imageAlt: null,
  price: "$199.00",
  rating: "4.7",
  badge: "Best Overall",
  description: "An aggressive, downturned shoe for steep bouldering and sport climbing.",
  pros: "Excellent heel hooking\nSensitive, grippy rubber",
  cons: "Tight break-in period",
  buttonText: null,
  design: null,
  clicks: 0,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

/** Renders the exact HTML visitors get, inside the site's fonts, so the preview matches the live post */
export function BoxPreview({ product, design, buttonText, newTab, sticky }: { product: Product; design: BoxDesign; buttonText: string; newTab: boolean; sticky?: boolean }) {
  const html = productBoxHtml({ ...product, design: null }, { newTab, buttonText, design });
  return (
    <div className="box-preview" style={sticky ? { position: "sticky", top: 46 } : undefined}>
      <div className="box-preview-label">Live preview</div>
      <div className="box-preview-stage" onClickCapture={(e) => e.preventDefault()} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
