/**
 * Minimal User-Agent parser. Only needs to be good enough to tell one of the
 * owner's own devices from an unexpected one in the login log.
 */

export interface DeviceInfo {
  browser: string;
  os: string;
  // Desktop / Mobile / Tablet / Bot / Unknown
  device: string;
}

const BROWSERS: [RegExp, string][] = [
  [/Edg[eA]?\/([\d.]+)/, "Edge"],
  [/OPR\/([\d.]+)|Opera/, "Opera"],
  [/Firefox\/([\d.]+)/, "Firefox"],
  [/Chrome\/([\d.]+)/, "Chrome"],
  [/Version\/([\d.]+).*Safari/, "Safari"],
  [/curl\/([\d.]+)/, "curl"],
  [/PostmanRuntime\/([\d.]+)/, "Postman"],
];

const OSES: [RegExp, string][] = [
  [/Windows NT 10\.0/, "Windows 10/11"],
  [/Windows NT ([\d.]+)/, "Windows"],
  [/iPhone OS ([\d_]+)/, "iOS"],
  [/iPad.*OS ([\d_]+)/, "iPadOS"],
  [/Mac OS X ([\d_.]+)/, "macOS"],
  [/Android ([\d.]+)/, "Android"],
  [/Linux/, "Linux"],
];

export const parseUserAgent = (ua: string): DeviceInfo => {
  if (!ua) return { browser: "Unknown", os: "Unknown", device: "Unknown" };

  if (/bot|crawler|spider|slurp|curl|wget|python-requests/i.test(ua)) {
    const matched = BROWSERS.find(([pattern]) => pattern.test(ua));
    return {
      browser: matched ? matched[1] : "Bot",
      os: "Unknown",
      device: "Bot",
    };
  }

  let browser = "Unknown";
  for (const [pattern, name] of BROWSERS) {
    const match = ua.match(pattern);
    if (match) {
      browser = match[1] ? `${name} ${match[1].split(".")[0]}` : name;
      break;
    }
  }

  // Browsers freeze the macOS version at 10.15.7, so its number means nothing
  const NO_VERSION = ["Windows 10/11", "macOS", "Linux"];

  let os = "Unknown";
  for (const [pattern, name] of OSES) {
    const match = ua.match(pattern);
    if (match) {
      const version = match[1]?.replace(/_/g, ".");
      // Only the major version keeps the column readable
      os =
        version && !NO_VERSION.includes(name)
          ? `${name} ${version.split(".")[0]}`
          : name;
      break;
    }
  }

  const device = /iPad|Tablet/i.test(ua)
    ? "Tablet"
    : /Mobile|iPhone|Android/i.test(ua)
    ? "Mobile"
    : "Desktop";

  return { browser, os, device };
};
