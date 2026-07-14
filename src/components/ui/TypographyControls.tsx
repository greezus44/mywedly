import React from "react";
import { type TypographyStyle } from "../../lib/typography";

interface TypographyControlsProps {
  value: TypographyStyle;
  onChange: (value: TypographyStyle) => void;
}

export function TypographyControls({ value, onChange }: TypographyControlsProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
        <select
          value={value.fontFamily}
          onChange={(e) => onChange({ ...value, fontFamily: e.target.value })}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
        >
          <option value="'Playfair Display', serif">Playfair Display</option>
          <option value="'Cormorant Garamond', serif">Cormorant Garamond</option>
          <option value="'Lora', serif">Lora</option>
          <option value="'Inter', sans-serif">Inter</option>
          <option value="'Lato', sans-serif">Lato</option>
          <option value="'Montserrat', sans-serif">Montserrat</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
          <input type="text" value={value.fontSize} onChange={(e) => onChange({ ...value, fontSize: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Weight</label>
          <select value={value.fontWeight} onChange={(e) => onChange({ ...value, fontWeight: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
            <option value="300">Light</option>
            <option value="400">Regular</option>
            <option value="500">Medium</option>
            <option value="600">Semibold</option>
            <option value="700">Bold</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Line Height</label>
          <input type="text" value={value.lineHeight} onChange={(e) => onChange({ ...value, lineHeight: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Letter Spacing</label>
          <input type="text" value={value.letterSpacing} onChange={(e) => onChange({ ...value, letterSpacing: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Text Transform</label>
          <select value={value.textTransform} onChange={(e) => onChange({ ...value, textTransform: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
            <option value="none">None</option>
            <option value="uppercase">Uppercase</option>
            <option value="lowercase">Lowercase</option>
            <option value="capitalize">Capitalize</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Align</label>
          <select value={value.textAlign} onChange={(e) => onChange({ ...value, textAlign: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Colour</label>
        <input type="color" value={value.color} onChange={(e) => onChange({ ...value, color: e.target.value })} className="w-full h-8 border border-gray-300 rounded cursor-pointer" />
      </div>
    </div>
  );
}
