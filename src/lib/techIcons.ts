import {
  siArduino,
  siBluetooth,
  siCplusplus,
  siCss,
  siEspressif,
  siExpress,
  siFlask,
  siGitlfs,
  siGooglecalendar,
  siHtml5,
  siJavascript,
  siJinja,
  siModelcontextprotocol,
  siMysql,
  siNodedotjs,
  siPandas,
  siPlatformio,
  siPython,
  siRos,
  siSqlalchemy,
  siUnity,
  type SimpleIcon
} from 'simple-icons';

export type TechBadge = {
  key: string;
  label: string;
  /** Brand logo from simple-icons; when absent, `monogram` is drawn as a text badge instead. */
  icon?: SimpleIcon;
  monogram?: string;
};

/**
 * Maps free-text stack entries from the project JSON files to logos.
 * One entry can match several badges (e.g. "HTML/CSS/JS"). Entries that match nothing
 * (concepts like "Differential-drive odometry") are left off the card but still listed in the detail view.
 * To support a new technology, import its `si*` icon and add a matcher here.
 */
const techMatchers: Array<{ pattern: RegExp; badge: TechBadge }> = [
  { pattern: /mysql/i, badge: { key: 'mysql', label: 'MySQL', icon: siMysql } },
  { pattern: /express/i, badge: { key: 'express', label: 'Express.js', icon: siExpress } },
  { pattern: /node\.?js/i, badge: { key: 'nodejs', label: 'Node.js', icon: siNodedotjs } },
  { pattern: /flask/i, badge: { key: 'flask', label: 'Flask', icon: siFlask } },
  { pattern: /\bhtml/i, badge: { key: 'html', label: 'HTML', icon: siHtml5 } },
  { pattern: /\bcss\b/i, badge: { key: 'css', label: 'CSS', icon: siCss } },
  // Bare "JS" only (not the ".js" in "Express.js"/"Node.js").
  { pattern: /(^|\/)\s*js\s*($|\/)|javascript/i, badge: { key: 'javascript', label: 'JavaScript', icon: siJavascript } },
  { pattern: /esp32/i, badge: { key: 'esp32', label: 'ESP32', icon: siEspressif } },
  { pattern: /c\+\+/i, badge: { key: 'cpp', label: 'C++', icon: siCplusplus } },
  { pattern: /arduino/i, badge: { key: 'arduino', label: 'Arduino', icon: siArduino } },
  { pattern: /platformio/i, badge: { key: 'platformio', label: 'PlatformIO', icon: siPlatformio } },
  { pattern: /bluetooth/i, badge: { key: 'bluetooth', label: 'Bluetooth Low Energy', icon: siBluetooth } },
  { pattern: /unity/i, badge: { key: 'unity', label: 'Unity', icon: siUnity } },
  // simple-icons dropped the C# logo (trademark request), so it gets a text badge.
  { pattern: /c#/i, badge: { key: 'csharp', label: 'C#', monogram: 'C#' } },
  { pattern: /^vr$/i, badge: { key: 'vr', label: 'Virtual reality', monogram: 'VR' } },
  { pattern: /git lfs/i, badge: { key: 'gitlfs', label: 'Git LFS', icon: siGitlfs } },
  { pattern: /python/i, badge: { key: 'python', label: 'Python', icon: siPython } },
  { pattern: /jinja/i, badge: { key: 'jinja', label: 'Jinja2', icon: siJinja } },
  { pattern: /sqlalchemy/i, badge: { key: 'sqlalchemy', label: 'SQLAlchemy', icon: siSqlalchemy } },
  { pattern: /google/i, badge: { key: 'google', label: 'Google OAuth & Calendar API', icon: siGooglecalendar } },
  { pattern: /pandas/i, badge: { key: 'pandas', label: 'pandas', icon: siPandas } },
  { pattern: /\bros\b/i, badge: { key: 'ros', label: 'ROS 2', icon: siRos } },
  { pattern: /\bmcp\b/i, badge: { key: 'mcp', label: 'Model Context Protocol', icon: siModelcontextprotocol } }
];

/** Every badge a single stack entry maps to, in matcher order. */
export function getBadgesForStackItem(item: string): TechBadge[] {
  return techMatchers.filter(({ pattern }) => pattern.test(item)).map(({ badge }) => badge);
}

/** Unique badges for a whole stack, in the order the stack lists them. */
export function getTechBadges(stack: string[]): TechBadge[] {
  const seen = new Set<string>();

  return stack.flatMap(getBadgesForStackItem).filter((badge) => {
    if (seen.has(badge.key)) {
      return false;
    }

    seen.add(badge.key);
    return true;
  });
}
