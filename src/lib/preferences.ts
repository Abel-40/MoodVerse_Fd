/**
 * Theme and motion preferences, kept in cookies so the inline script below can
 * apply them before first paint.
 *
 * `data-theme` on <html> always holds a resolved "light" or "dark"; a "system"
 * preference is resolved from prefers-color-scheme by the script, and kept in
 * step afterwards by `PreferencesSync`. `data-motion="reduced"` is set when the
 * user turns off Gentle motion, and `data-js` marks that scripts run, so
 * enter animations may start hidden. This module is safe to import on the server.
 */

export type ThemePreference = "system" | "light" | "dark";

export const THEME_COOKIE = "mv-theme";
export const MOTION_COOKIE = "mv-motion";
export const TEXT_COOKIE = "mv-text";

/** Settings' text-size steps (1 to 5), as multipliers of the designed sizes. */
export const TEXT_SCALES = [0.9, 1, 1.1, 1.2, 1.35] as const;
export const DEFAULT_TEXT_SIZE = 2;

/** Runs in <head> before the body paints. Keep it dependency-free. */
export const PREFERENCES_SCRIPT = `(function(){try{
var d=document.documentElement,c=document.cookie;
d.setAttribute("data-js","");
var m=c.match(/(?:^|;\\s*)${THEME_COOKIE}=(light|dark|system)/);
var p=m?m[1]:"system";
d.setAttribute("data-theme",p==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p);
if(/(?:^|;\\s*)${MOTION_COOKIE}=reduced/.test(c))d.setAttribute("data-motion","reduced");
var s=c.match(/(?:^|;\\s*)${TEXT_COOKIE}=([1-5])/);
if(s)d.style.setProperty("--mv-text-scale",String(${JSON.stringify(TEXT_SCALES)}[s[1]-1]));
}catch(e){}})();`;
