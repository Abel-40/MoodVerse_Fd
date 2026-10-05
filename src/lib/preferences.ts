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

/** Runs in <head> before the body paints. Keep it dependency-free. */
export const PREFERENCES_SCRIPT = `(function(){try{
var d=document.documentElement,c=document.cookie;
d.setAttribute("data-js","");
var m=c.match(/(?:^|;\\s*)${THEME_COOKIE}=(light|dark|system)/);
var p=m?m[1]:"system";
d.setAttribute("data-theme",p==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p);
if(/(?:^|;\\s*)${MOTION_COOKIE}=reduced/.test(c))d.setAttribute("data-motion","reduced");
}catch(e){}})();`;
