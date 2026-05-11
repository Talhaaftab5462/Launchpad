import React, { useState, useEffect } from 'react';

/**
 * Logo component — loads logo.svg and applies accent color.
 * Uses IPC in Electron (works packaged), fetch() fallback in browser dev.
 */
export default function Logo({ size = 26, accent = '#c07cff', style }) {
  const [svgContent, setSvgContent] = useState('');

  useEffect(() => {
    const apply = (raw) => {
      if (!raw) return;
      const updated = raw.replace(/#c07cff/gi, accent);
      setSvgContent(updated);
    };

    // Electron: use IPC so it works in both dev and packaged app
    if (window.electronAPI?.readLogoSvg) {
      window.electronAPI.readLogoSvg().then(apply);
    } else {
      // Browser fallback
      fetch('/logo.svg').then(r => r.text()).then(apply).catch(console.error);
    }
  }, [accent]);

  if (!svgContent) {
    return <div style={{ width: size, height: size, background: 'transparent' }} />;
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}