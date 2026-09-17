export function networkAccentInk(hex: string) {
  const value = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#d2f58a";
  const channels = [1,3,5].map(i => {
    const c = parseInt(value.slice(i,i+2),16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0]*0.2126 + channels[1]*0.7152 + channels[2]*0.0722;
  return luminance > 0.179 ? "#000000" : "#ffffff";
}
