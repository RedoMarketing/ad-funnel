const IOS_SWITCH_ID = "haptic-switch";

/**
 * Fires a short haptic tap.
 *
 * iOS Safari does not implement navigator.vibrate. The one thing that does
 * buzz there is a checkbox carrying the `switch` attribute (Safari 17.4+):
 * activating its label produces the system toggle haptic. So we click a
 * hidden one. Android and Chrome get navigator.vibrate instead.
 *
 * Must be called from a real user gesture, and is a silent no-op anywhere
 * that supports neither.
 */
export function haptic() {
  if (typeof document === "undefined") return;

  const label = document.querySelector<HTMLLabelElement>(`label[for="${IOS_SWITCH_ID}"]`);
  if (label) {
    label.click();
    return;
  }

  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(8);
  }
}

export { IOS_SWITCH_ID };
