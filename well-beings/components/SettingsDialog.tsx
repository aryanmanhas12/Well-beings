"use client";

import { useEffect, useState } from "react";
import { savePreferences } from "./PrefsLoader";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [theme, setTheme] = useState("auto");
  const [contrast, setContrast] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem("well-beings-prefs") || "{}");
      setTheme(prefs.theme || "auto");
      setContrast(prefs.contrast || false);
      setScale(prefs.scale || 1);
    } catch (e) {
      // Defaults are fine
    }
  }, [isOpen]);

  const handleSave = () => {
    savePreferences(theme, contrast, scale);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1001,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: "500px",
          width: "90vw",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "2rem",
          gap: "1.5rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "24px", fontWeight: 600, margin: 0 }}>Display Settings</h2>

        {/* Theme selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label style={{ fontSize: "14px", fontWeight: 600 }}>Theme</label>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {["auto", "light", "dark"].map((t) => (
              <label key={t} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  checked={theme === t}
                  onChange={(e) => setTheme(e.target.value)}
                  style={{ cursor: "pointer" }}
                />
                <span style={{ textTransform: "capitalize" }}>{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* High contrast toggle */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label style={{ fontSize: "14px", fontWeight: 600 }}>Accessibility</label>
          <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={contrast}
              onChange={(e) => setContrast(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <span>High contrast mode</span>
          </label>
        </div>

        {/* Text scale slider */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label style={{ fontSize: "14px", fontWeight: 600 }}>Text Size</label>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span style={{ fontSize: "12px" }}>100%</span>
            <input
              type="range"
              min="0.9"
              max="1.5"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              style={{ flex: 1, minHeight: "44px" }}
            />
            <span style={{ fontSize: "12px" }}>{Math.round(scale * 100)}%</span>
          </div>
          <div
            style={{
              padding: "12px",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              fontSize: `${scale * 14.5}px`,
            }}
          >
            The quick brown fox jumps over the lazy dog
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: "10px 20px", minHeight: "44px" }}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} style={{ padding: "10px 20px", minHeight: "44px" }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
