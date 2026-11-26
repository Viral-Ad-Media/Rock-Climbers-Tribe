"use client";

import { useState } from "react";
import { DEFAULT_BOX_DESIGN, parseBoxDesign } from "@/lib/products";
import { BoxDesignControls, BoxPreview, SAMPLE_PRODUCT } from "./box-design";

/** Site-wide product box design for Settings > Affiliate Links, saved as JSON in the affiliate_box_design option */
export function BoxDesignSetting({ initial, buttonText, newTab }: { initial: string; buttonText: string; newTab: boolean }) {
  const [design, setDesign] = useState(() => parseBoxDesign(initial));
  return (
    <div className="design-split">
      <input type="hidden" name="affiliate_box_design" value={JSON.stringify(design)} />
      <div>
        <BoxDesignControls value={design} onChange={setDesign} />
        <p style={{ margin: "12px 0 0" }}>
          <button type="button" className="button-link" onClick={() => setDesign(DEFAULT_BOX_DESIGN)}>Reset to the default design</button>
        </p>
      </div>
      <BoxPreview product={SAMPLE_PRODUCT} design={design} buttonText={buttonText} newTab={newTab} sticky />
    </div>
  );
}
