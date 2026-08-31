import fs from 'fs';
import path from 'path';

const icons = [
  'Search', 'Download', 'BookOpen', 'GraduationCap', 'BookDashed', 'BookPlaceholder',
  'Sun', 'Moon', 'User', 'Library', 'BookText', 'ScrollText', 'Sparkles', 'BookMarked',
  'Languages', 'Users', 'CheckCircle', 'Bookmark', 'ArrowLeft', 'CircleX', 'XCircle',
  'Trash2', 'Share2', 'DownloadCloud', 'UploadCloud', 'AlertCircle', 'CheckCircle2',
  'Loader2', 'FolderOpen', 'Compass', 'MapPin', 'Play', 'Pause', 'ChevronRight', 'WifiOff',
  'RotateCcw', 'SlidersHorizontal', 'Star', 'Grid3X3', 'List', 'ChevronDown', 'ChevronUp',
  'Bot', 'Filter', 'Tag', 'Gift', 'Zap', 'Heart', 'Home', 'MoreHorizontal', 'MessageSquare',
  'Mic', 'Disc', 'Database', 'BookHeart', 'Copy', 'Send', 'Smile', 'Frown', 'CloudRain',
  'BookOpenText', 'Calendar', 'ClipboardList', 'Clock', 'Plus', 'Save', 'Volume2', 'Layers',
  'Brain', 'Flame', 'Trophy', 'Target', 'SkipBack', 'SkipForward', 'Settings', 'Repeat',
  'Wifi', 'ExternalLink', 'Calculator', 'Receipt', 'LayoutGrid', 'Upload', 'Image',
  'FileText', 'Pencil', 'Loader', 'X'
];

function toKebab(name) {
  if (name === 'BookPlaceholder') return 'book-dashed';
  if (name === 'Grid3X3') return 'grid-3x3';
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    .toLowerCase();
}

async function run() {
  const result = {};
  console.log(`Starting to fetch ${icons.length} icons (dependency-free)...`);

  for (const name of icons) {
    const kebab = toKebab(name);
    const url = `https://unpkg.com/lucide-static/icons/${kebab}.svg`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const svgText = await res.text();
      
      // Simple regex to extract inner content of <svg>
      const match = svgText.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
      if (!match) {
        throw new Error("Could not parse SVG tags");
      }
      
      const childrenHtml = match[1].trim();
      
      // Clean attributes for React compatibility if necessary
      let cleaned = childrenHtml
        .replace(/stroke-width=/g, 'strokeWidth=')
        .replace(/stroke-linecap=/g, 'strokeLinecap=')
        .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
        .replace(/fill-rule=/g, 'fillRule=')
        .replace(/clip-rule=/g, 'clipRule=')
        .replace(/stroke-miterlimit=/g, 'strokeMiterlimit=')
        .replace(/stroke-dasharray=/g, 'strokeDasharray=')
        .replace(/stroke-dashoffset=/g, 'strokeDashoffset=')
        .replace(/font-family=/g, 'fontFamily=')
        .replace(/font-size=/g, 'fontSize=')
        .replace(/font-weight=/g, 'fontWeight=');

      result[name] = cleaned;
      console.log(`Successfully fetched ${name} (${kebab})`);
    } catch (e) {
      console.error(`Failed to fetch icon ${name} (${kebab}) from ${url}:`, e.message);
    }
  }

  // Generate the new lucide-react-shim.jsx file content
  let output = `import React from 'react';\n\n`;
  output += `const iconData = {\n`;
  for (const [name, html] of Object.entries(result)) {
    output += `  ${name}: ${JSON.stringify(html)},\n`;
  }
  output += `};\n\n`;

  output += `const make = (name) => {\n`;
  output += `  const Comp = (props) => {\n`;
  output += `    const rawSvgContent = iconData[name];\n`;
  output += `    if (!rawSvgContent) return null;\n`;
  output += `    return (\n`;
  output += `      <svg\n`;
  output += `        aria-hidden="true"\n`;
  output += `        width={props.size || 20}\n`;
  output += `        height={props.size || 20}\n`;
  output += `        viewBox="0 0 24 24"\n`;
  output += `        fill="none"\n`;
  output += `        stroke="currentColor"\n`;
  output += `        strokeWidth={props.strokeWidth || 2}\n`;
  output += `        strokeLinecap="round"\n`;
  output += `        strokeLinejoin="round"\n`;
  output += `        {...props}\n`;
  output += `        dangerouslySetInnerHTML={{ __html: rawSvgContent }}\n`;
  output += `      />\n`;
  output += `    );\n`;
  output += `  };\n`;
  output += `  Comp.displayName = name;\n`;
  output += `  return Comp;\n`;
  output += `};\n\n`;

  for (const name of icons) {
    output += `export const ${name} = make('${name}');\n`;
  }

  output += `\nexport default {\n`;
  output += icons.map(name => `  ${name}`).join(',\n') + '\n';
  output += `};\n`;

  const targetPath = path.resolve('src/shims/lucide-react-shim.jsx');
  fs.writeFileSync(targetPath, output, 'utf8');
  console.log(`Successfully generated and wrote lucide-react-shim.jsx to ${targetPath}`);
}

run();
