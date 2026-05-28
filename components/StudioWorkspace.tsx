"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ListingItem } from "./ListingTypes";
import { 
  Sparkles, Undo, Save, ChevronLeft, Sliders, Paintbrush, 
  Crop, Eye, Loader2, Check, Wand2, Palette, ChevronRight, Download
} from "lucide-react";

interface StudioWorkspaceProps {
  item: ListingItem;
  onUpdate: (updated: ListingItem) => void;
  onBack: () => void;
}

const bgColorPresets = [
  { name: "Slate Dark", value: "slate", class: "bg-slate-800" },
  { name: "Clean White", value: "white", class: "bg-white border-slate-300" },
  { name: "Matte Black", value: "black", class: "bg-neutral-950" },
  { name: "Emerald Mint", value: "emerald", class: "bg-emerald-700" },
  { name: "Sunset Gold", value: "amber", class: "bg-amber-600" },
  { name: "Rose Whisper", value: "rose", class: "bg-rose-700" },
  { name: "Neon Cyber", value: "cyan", class: "bg-cyan-700" }
];

const AI_SETTING_PRESETS = [
  { 
    name: "Obsidian Slate", 
    prompt: "A luxury dark obsidian stone block with dark ambient background, golden spotlight focused on the item on the block", 
    desc: "Sleek & Moody" 
  },
  { 
    name: "Classic Marble", 
    prompt: "Floating over a white Italian Carrara marble countertop with soft warm morning light shining from the side", 
    desc: "Luxury & Timeless" 
  },
  { 
    name: "Oak Dining Table", 
    prompt: "Placed flat on a rustic light oak wooden table, polished finish, shallow depth of field, minimalist studio background", 
    desc: "Warm & Natural" 
  },
  { 
    name: "Cyberpunk Hologram", 
    prompt: "Suspended inside a futuristic floating holographic frame, neon glowing cyan and indigo lights, deep dark background", 
    desc: "Bold & High-Tech" 
  },
  { 
    name: "Sunset Beach", 
    prompt: "Resting on white tropical beach sand, out-of-focus soft turquoise ocean waves and sunset bokeh background", 
    desc: "Vibrant & Organic" 
  },
  { 
    name: "Editorial Concrete", 
    prompt: "A clean minimalist industrial grey studio concrete surface with dramatic soft angular shadows", 
    desc: "Contemporary Minimal" 
  }
];

export default function StudioWorkspace({ item, onUpdate, onBack }: StudioWorkspaceProps) {
  const [bgRemoved, setBgRemoved] = useState(item.bgRemoved || false);
  const [bgColor, setBgColor] = useState(item.bgColor || "slate");
  const [brightness, setBrightness] = useState(item.brightness || 100);
  const [contrast, setContrast] = useState(item.contrast || 100);
  const [saturation, setSaturation] = useState(item.saturation || 100);
  const [blur, setBlur] = useState(item.blur || 0);
  const [cropRatio, setCropRatio] = useState(item.cropRatio || "original");

  // Track the actual active processed image state (supports loaded device original or AI outputs)
  const [imageProcessed, setImageProcessed] = useState(item.imageProcessed || item.imageOriginal);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<"solid" | "ai">("ai");
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(null);
  const [aiEditError, setAiEditError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadResult = async () => {
    setIsDownloading(true);
    try {
      const targetUrl = imageProcessed;
      if (targetUrl.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = targetUrl;
        const mime = targetUrl.split(";")[0].split(":")[1] || "image/png";
        const ext = mime.split("/")[1] || "png";
        link.download = `curated-product-${item.id || "edited"}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const response = await fetch(targetUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `curated-product-${item.id || "edited"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error("Failed to automatically download processed image:", err);
      // Fallback direct tab opening behavior
      window.open(imageProcessed, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSimulateRemoveBg = () => {
    setIsRemoving(true);
    setTimeout(() => {
      setBgRemoved(true);
      setIsRemoving(false);
    }, 1200);
  };

  const handleApplyAiBackdrop = async (sceneryPrompt: string) => {
    if (!sceneryPrompt.trim()) return;
    setIsAiEditing(true);
    setAiEditError("");
    
    try {
      const response = await fetch("/api/gemini/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image: item.imageOriginal,
          prompt: sceneryPrompt
        })
      });

      if (!response.ok) {
        throw new Error("Failed to edit image background setting.");
      }

      const data = await response.json();
      if (data.imageProcessed) {
        setImageProcessed(data.imageProcessed);
        setBgRemoved(true); // Flag custom background placed
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      setAiEditError("Model fallback: Generating simulated high-contrast background setup.");
      
      // Fallback sandbox simulation mapping using preset scenery seeds
      const sanitizedPrompt = sceneryPrompt.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20);
      setImageProcessed(`https://picsum.photos/seed/scenery-${sanitizedPrompt}/600/600`);
      setBgRemoved(true);
    } finally {
      setIsAiEditing(false);
    }
  };

  const handleReset = () => {
    setBgRemoved(false);
    setBgColor("slate");
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setCropRatio("original");
    setImageProcessed(item.imageOriginal);
    setSelectedPresetIndex(null);
    setCustomPrompt("");
    setAiEditError("");
  };

  const handleSaveChanges = () => {
    const updated: ListingItem = {
      ...item,
      bgRemoved,
      bgColor,
      brightness,
      contrast,
      saturation,
      blur,
      cropRatio,
      imageProcessed: imageProcessed !== item.imageOriginal 
        ? imageProcessed 
        : bgRemoved 
        ? `https://picsum.photos/seed/product-${item.id}-${bgColor}/600/600`
        : item.imageOriginal
    };
    onUpdate(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onBack();
    }, 1000);
  };

  // Build the CSS filter string
  const filterStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${blur > 0 ? `blur(${blur}px)` : ""}`
  };

  const selectedBgPreset = bgColorPresets.find(p => p.value === bgColor) || bgColorPresets[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border border-slate-900 bg-slate-950 p-6 rounded-2xl relative">
      
      {/* Back button link info */}
      <button 
        onClick={onBack}
        className="absolute top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-all cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>Exit Studio</span>
      </button>

      {/* Visual Canvas Display Area */}
      <div className="lg:col-span-7 flex flex-col justify-between space-y-4 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-950/40 p-2 sm:p-0 rounded-xl">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5 font-display">
              <Sparkles className="w-4 h-4 text-teal-400 stroke-[2.5]" />
              <span>Product Photo Studio</span>
            </h2>
            <p className="text-xs text-slate-400">Improve your item photos and blend them seamlessly into premium sales backdrops</p>
          </div>
          
          <button
            onClick={handleDownloadResult}
            disabled={isDownloading}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-mono text-slate-950 font-bold bg-teal-500 hover:bg-teal-400 rounded-lg transition-all cursor-pointer disabled:opacity-50 select-none"
            title="Download full quality edited image to your device"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isDownloading ? "Downloading..." : "Download Result"}</span>
          </button>
        </div>

        {/* Dynamic Image Container Box */}
        <div className="w-full aspect-square relative rounded-xl border border-slate-850 overflow-hidden flex items-center justify-center p-6 bg-slate-950">
          
          {/* Main Visual background element representing color setting layer */}
          <div 
            className={`absolute inset-0 transition-colors duration-350 ${
              bgRemoved && activeTab === "solid" ? selectedBgPreset.class : "bg-slate-900"
            }`}
          />

          {/* Interactive Preview of Edited Object */}
          <div 
            className="w-full h-full relative transition-all"
            style={{
              ...filterStyle,
              aspectRatio: cropRatio === "1:1" ? "1/1" : cropRatio === "4:3" ? "4/3" : cropRatio === "3:4" ? "3/4" : "auto"
            }}
          >
            <Image
              src={imageProcessed}
              alt="Preview Studio Canvas"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={`object-contain transition-all duration-300 ${
                bgRemoved && activeTab === "solid" ? "mix-blend-multiply brightness-105" : ""
              }`}
              referrerPolicy="no-referrer"
              unoptimized
            />
          </div>

          {/* Cleaning Screen Overlay */}
          {(isRemoving || isAiEditing) && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-10 animate-fade-in">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
              <p className="text-xs font-mono text-teal-400 font-bold uppercase tracking-wider">
                {isRemoving ? "Erasing Background..." : "Generative AI Scenery Placement Active..."}
              </p>
            </div>
          )}
        </div>

        {/* Secondary Details */}
        <div className="bg-slate-905/40 rounded-xl p-3 border border-slate-900/60 flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <p className="text-[10px] text-slate-400 leading-normal">
            Adjust styling parameters instantly. Use AI Setting Backdrops to place luxury watches, bags, sneakers or items inside high-end realistic ambient photorealistic environments.
          </p>
        </div>
      </div>

      {/* Control sliders & tuning panel */}
      <div className="lg:col-span-5 space-y-6 flex flex-col justify-between pt-8">
        
        <div className="space-y-6">
          
          {/* Main Background Tuning Selector Tab */}
          <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold font-mono uppercase text-slate-400 flex items-center gap-1.5">
                <Paintbrush className="w-3.5 h-3.5 text-teal-400" />
                <span>Background Studio</span>
              </h4>
              
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-850">
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold transition-all ${
                    activeTab === "ai" 
                      ? "bg-teal-500 text-slate-950" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  AI Backdrops
                </button>
                <button
                  onClick={() => setActiveTab("solid")}
                  className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold transition-all ${
                    activeTab === "solid" 
                      ? "bg-teal-500 text-slate-950" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Solid Color
                </button>
              </div>
            </div>

            {aiEditError && (
              <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg text-[9px] font-mono text-amber-500">
                {aiEditError}
              </div>
            )}

            {activeTab === "ai" ? (
              // AI SCENERY PLACEMENT MODULE
              <div className="space-y-4 animate-fade-in">
                <p className="text-[10px] text-slate-400">Place product in luxury settings:</p>
                
                <div className="grid grid-cols-2 gap-2 max-h-[170px] overflow-y-auto pr-1">
                  {AI_SETTING_PRESETS.map((preset, index) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setSelectedPresetIndex(index);
                        handleApplyAiBackdrop(preset.prompt);
                      }}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer relative ${
                        selectedPresetIndex === index 
                          ? "bg-teal-500/10 border-teal-500" 
                          : "bg-slate-950 border-slate-850 hover:border-slate-750"
                      }`}
                    >
                      <p className="text-[11px] font-bold text-white leading-tight flex items-center gap-1">
                        <Wand2 className="w-3 h-3 text-teal-400 flex-shrink-0" />
                        <span>{preset.name}</span>
                      </p>
                      <p className="text-[9px] text-slate-500 leading-normal mt-0.5">{preset.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Custom Text Prompt Input block */}
                <div className="space-y-2 pt-2 border-t border-slate-850">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Custom Scenery Prompt</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. moody dark violet marble stand..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-[11px] text-white placeholder-slate-650 outline-none focus:border-teal-500 transition-all font-mono"
                    />
                    <button
                      onClick={() => {
                        setSelectedPresetIndex(null);
                        handleApplyAiBackdrop(customPrompt);
                      }}
                      disabled={!customPrompt.trim() || isAiEditing}
                      className="absolute right-1 top-1 bottom-1 bg-teal-500 hover:bg-teal-400 text-slate-950 px-2 rounded font-black text-[9px] transition-all cursor-pointer flex items-center gap-0.5 uppercase font-mono"
                    >
                      <span>GO</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // SOLID COLOR BLOCK (CLEAN MASK SIZING FLOW)
              <div className="space-y-3 animate-fade-in">
                {!bgRemoved ? (
                  <button
                    onClick={handleSimulateRemoveBg}
                    disabled={isRemoving}
                    className="w-full py-2.5 bg-gradient-to-tr from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold font-mono rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Background Removal Masking</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400">Pick a background color:</p>
                    <div className="flex flex-wrap gap-2">
                      {bgColorPresets.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => setBgColor(preset.value)}
                          title={preset.name}
                          className={`h-7 w-7 rounded-full ${preset.class} border-2 cursor-pointer relative flex items-center justify-center transition-all ${
                            bgColor === preset.value ? "border-teal-400 scale-110" : "border-slate-800 hover:border-slate-500"
                          }`}
                        >
                          {bgColor === preset.value && (
                            <Check className="w-3.5 h-3.5 text-teal-400 filter drop-shadow stroke-[3]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sliders Adjustment Section */}
          <div className="space-y-4 p-4 bg-slate-900 border border-slate-850 rounded-xl">
            <h4 className="text-xs font-bold font-mono uppercase text-slate-400 flex items-center gap-1.5 border-b border-slate-850 pb-2">
              <Sliders className="w-3.5 h-3.5 text-teal-400" />
              <span>Enhancements</span>
            </h4>

            {/* Brightness Row */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Brightness</span>
                <span>{brightness}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>

            {/* Contrast Row */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Contrast</span>
                <span>{contrast}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>

            {/* Saturation Row */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Saturation</span>
                <span>{saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={saturation}
                onChange={(e) => setSaturation(parseInt(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>

            {/* Gaussian Blur Row */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Gaussian Blur</span>
                <span>{blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={blur}
                onChange={(e) => setBlur(parseInt(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Aspect Ratios Selector */}
          <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl space-y-3">
            <h4 className="text-xs font-bold font-mono uppercase text-slate-400 flex items-center gap-1.5">
              <Crop className="w-3.5 h-3.5 text-teal-400" />
              <span>Crop Ratio</span>
            </h4>
            <div className="grid grid-cols-4 gap-1.5">
              {["original", "1:1", "4:3", "3:4"].map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setCropRatio(ratio)}
                  className={`py-1.5 rounded text-[10px] font-mono font-bold capitalize cursor-pointer border transition-all ${
                    cropRatio === ratio
                      ? "bg-teal-500 border-teal-500 text-slate-950 font-black"
                      : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Global Control Ends */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-905">
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:border-slate-650 text-slate-405 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Undo className="w-3.5 h-3.5" />
            <span>Reset Canvas</span>
          </button>
          
          <button
            onClick={handleSaveChanges}
            disabled={saveSuccess}
            className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/10"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Session</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
