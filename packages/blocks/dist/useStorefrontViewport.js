import { useState, useEffect } from "react";
/** Matches builder preview: mobile 576, tablet 768 (see ViewportSwitcher VIEWPORT_WIDTHS). */
const MQ_MOBILE = "(max-width: 476px)";
const MQ_TABLET = "(min-width: 577px) and (max-width: 768px)";
function resolveViewport() {
    if (typeof window === "undefined")
        return "desktop";
    if (window.matchMedia(MQ_MOBILE).matches)
        return "mobile";
    if (window.matchMedia(MQ_TABLET).matches)
        return "tablet";
    return "desktop";
}
/**
 * Live storefront viewport bucket for resolving `layoutByViewport`. Updates on resize.
 */
export function useStorefrontViewport() {
    const [viewport, setViewport] = useState(() => resolveViewport());
    useEffect(() => {
        const mMobile = window.matchMedia(MQ_MOBILE);
        const mTablet = window.matchMedia(MQ_TABLET);
        const update = () => setViewport(resolveViewport());
        mMobile.addEventListener("change", update);
        mTablet.addEventListener("change", update);
        update();
        return () => {
            mMobile.removeEventListener("change", update);
            mTablet.removeEventListener("change", update);
        };
    }, []);
    return viewport;
}
