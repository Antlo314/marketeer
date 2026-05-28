"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ListingItem } from "./ListingTypes";
import { 
  Share2, ArrowLeft, ArrowUpRight, CheckCircle2, AlertCircle, 
  Eye, MessageCircle, HelpCircle, Heart, Send, Sparkles,
  Settings, Globe, Cpu, Save, Loader2, Link as LinkIcon
} from "lucide-react";

interface ChannelManagerProps {
  item: ListingItem;
  onUpdate: (updated: ListingItem) => void;
  onBack: () => void;
}

const customClientNames = ["Marcus Finch", "Kaitlyn Ross", "Bradley Vance", "Elena Smith", "Dan Thorne"];
const mockInquiryTexts = [
  "Hi, is this still available? Can we coordinate a meetup tonight?",
  "Beautiful piece! I can pay immediately if you're open to checking shipping prices.",
  "What is your absolute lowest pricing boundary on this bag?",
  "I live only two blocks away. Could I come check the condition in person?"
];

export default function ChannelManager({ item, onUpdate, onBack }: ChannelManagerProps) {
  const [channels, setChannels] = useState(item.channels || {
    ebay: false, facebook: false, offerup: false, nextdoor: false
  });
  const [loadingChannel, setLoadingChannel] = useState<string | null>(null);

  // New state for channel tabs: resale network vs store api
  const [activeChannelTab, setActiveChannelTab] = useState<"resale" | "store_api">("resale");

  // Store integration states
  const [activeApiPlatform, setActiveApiPlatform] = useState<"shopify" | "woocommerce">("shopify");
  const [shopifyDomain, setShopifyDomain] = useState(() => typeof window !== "undefined" ? localStorage.getItem("mktr_shopify_domain") || "" : "");
  const [shopifyToken, setShopifyToken] = useState(() => typeof window !== "undefined" ? localStorage.getItem("mktr_shopify_token") || "" : "");
  const [wooUrl, setWooUrl] = useState(() => typeof window !== "undefined" ? localStorage.getItem("mktr_woo_url") || "" : "");
  const [wooKey, setWooKey] = useState(() => typeof window !== "undefined" ? localStorage.getItem("mktr_woo_key") || "" : "");
  const [wooSecret, setWooSecret] = useState(() => typeof window !== "undefined" ? localStorage.getItem("mktr_woo_secret") || "" : "");

  // Publishing states
  const [isExporting, setIsExporting] = useState(false);
  const [apiSuccessMsg, setApiSuccessMsg] = useState("");
  const [apiErrorMsg, setApiErrorMsg] = useState("");
  const [apiProductLink, setApiProductLink] = useState("");
  const [sandboxMode, setSandboxMode] = useState(true); // default sandboxed mode enabled for high user friendliness

  // Simulated messaging hub
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string; isUser: boolean }[]>([
    { 
      sender: "Marcus Finch", 
      text: "Hey! I saw your post. Really interested. Is the price firm?", 
      time: "10:14 AM", 
      isUser: false 
    }
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSaveCredentials = (platform: "shopify" | "woocommerce") => {
    if (typeof window === "undefined") return;
    if (platform === "shopify") {
      localStorage.setItem("mktr_shopify_domain", shopifyDomain);
      localStorage.setItem("mktr_shopify_token", shopifyToken);
      alert("Shopify credentials saved locally!");
    } else {
      localStorage.setItem("mktr_woo_url", wooUrl);
      localStorage.setItem("mktr_woo_key", wooKey);
      localStorage.setItem("mktr_woo_secret", wooSecret);
      alert("WooCommerce credentials saved locally!");
    }
  };

  const handleExportToApi = async () => {
    setIsExporting(true);
    setApiSuccessMsg("");
    setApiErrorMsg("");
    setApiProductLink("");

    if (sandboxMode) {
      setTimeout(() => {
        setIsExporting(false);
        setApiSuccessMsg(`[DEMO MODE SUCCESS] Successfully mapped and transmitted item "${item.title}" to ${activeApiPlatform === "shopify" ? "Shopify Products Admin API" : "WooCommerce v3 REST Client"}!`);
        setApiProductLink(activeApiPlatform === "shopify"
          ? `https://${shopifyDomain || "sandbox-test-reseller"}.myshopify.com/admin/products`
          : `${wooUrl || "https://example-sandbox-woo.com"}/wp-admin/edit.php?post_type=product`
        );

        setMessages(prev => [
          ...prev,
          { sender: "System API Integration", text: `⭐ Sandboxed publishing complete for ${activeApiPlatform.toUpperCase()}! Product is safe.`, time: "Just now", isUser: true }
        ]);
      }, 1500);
      return;
    }

    // Real proxy request
    const config = activeApiPlatform === "shopify"
      ? { shopDomain: shopifyDomain, accessToken: shopifyToken }
      : { siteUrl: wooUrl, consumerKey: wooKey, consumerSecret: wooSecret };

    // Validations
    if (activeApiPlatform === "shopify" && (!shopifyDomain || !shopifyToken)) {
      setApiErrorMsg("Please enter both Shopify Shop Domain and Admin API Access Token. Or enable Sandbox Demonstration Mode to test.");
      setIsExporting(false);
      return;
    }
    if (activeApiPlatform === "woocommerce" && (!wooUrl || !wooKey || !wooSecret)) {
      setApiErrorMsg("Please configure all WooCommerce REST API credentials. Or enable Sandbox Demonstration Mode.");
      setIsExporting(false);
      return;
    }

    try {
      const response = await fetch("/api/export-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeType: activeApiPlatform,
          config,
          product: item,
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || resData.details || "API connection rejected.");
      }

      setIsExporting(false);
      setApiSuccessMsg(resData.message || "Product published successfully to store drafts!");
      if (resData.adminUrl) {
        setApiProductLink(resData.adminUrl);
      }

      setMessages(prev => [
        ...prev,
        { sender: "System API Integration", text: `✅ Live Product drafted on your ${activeApiPlatform.toUpperCase()} store Dashboard successfully!`, time: "Just now", isUser: true }
      ]);
    } catch (err: any) {
      console.error(err);
      setApiErrorMsg(`Export integration failed: ${err.message || err}. Check network CORS/credentials or switch to 'Sandbox Demonstration Mode' for immediate testing.`);
      setIsExporting(false);
    }
  };

  const handleToggleChannel = (key: "ebay" | "facebook" | "offerup" | "nextdoor") => {
    const nextVal = !channels[key];
    
    if (nextVal) {
      setLoadingChannel(key);
      setTimeout(() => {
        const nextChannels = { ...channels, [key]: true };
        setChannels(nextChannels);
        setLoadingChannel(null);

        // Update main item state as well
        const updatedItem: ListingItem = {
          ...item,
          channels: nextChannels,
          status: "Active",
          views: (item.views || 0) + Math.floor(Math.random() * 20) + 10,
          inquiries: (item.inquiries || 0) + Math.floor(Math.random() * 2) + 1
        };
        onUpdate(updatedItem);

        // Append a notification message
        const randomName = customClientNames[Math.floor(Math.random() * customClientNames.length)];
        const randomText = mockInquiryTexts[Math.floor(Math.random() * mockInquiryTexts.length)];
        setMessages(prev => [
          ...prev,
          { sender: "System Notification", text: `🚀 Listing successfully cross-posted to ${key.toUpperCase()}!`, time: "Just now", isUser: true },
          { sender: randomName, text: randomText, time: "Just now", isUser: false }
        ]);

      }, 1000);
    } else {
      const nextChannels = { ...channels, [key]: false };
      setChannels(nextChannels);
      
      const updatedItem: ListingItem = {
        ...item,
        channels: nextChannels,
        status: Object.values(nextChannels).some(Boolean) ? "Active" : "Draft"
      };
      onUpdate(updatedItem);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setMessages(prev => [
      ...prev,
      { sender: "You", text: newMessage, time: "Just now", isUser: true }
    ]);
    setNewMessage("");

    // Simulate reply after 1500ms
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { 
          sender: "Marcus Finch", 
          text: "Thanks for the swift reply. That sounds completely reasonable to me. I can pick it up tomorrow afternoon!", 
          time: "Just now", 
          isUser: false 
        }
      ]);
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-950 p-6 rounded-2xl border border-slate-900 shadow-2xl">
      
      {/* Channels List Columns */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5 font-display">
              <Share2 className="w-4 h-4 text-teal-400" />
              <span>Listing Channels Manager</span>
            </h2>
            <p className="text-xs text-slate-400">Push this item online across marketplaces and custom store APIs</p>
          </div>

          <button
            onClick={onBack}
            className="text-xs font-mono font-bold text-slate-450 hover:text-white px-3 py-1.5 border border-slate-800 hover:border-slate-700 bg-slate-950 rounded-lg flex items-center gap-1 justify-center transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Inventory Catalog</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/50 p-1 rounded-xl border border-slate-900">
          <button
            onClick={() => setActiveChannelTab("resale")}
            className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 justify-center cursor-pointer ${
              activeChannelTab === "resale"
                ? "bg-slate-950 text-white border border-slate-850"
                : "text-slate-450 hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Resale Networks</span>
          </button>

          <button
            onClick={() => setActiveChannelTab("store_api")}
            className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 justify-center cursor-pointer ${
              activeChannelTab === "store_api"
                ? "bg-slate-950 text-white border border-slate-850"
                : "text-slate-450 hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Direct Store APIs</span>
          </button>
        </div>

        {activeChannelTab === "resale" ? (
          /* Channels Control List */
          <div className="space-y-4">
            
            {/* Channel Item: eBay */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-start gap-4 transition-all">
              <div className="h-10 w-10 flex-shrink-0 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center font-black font-mono text-sm border border-blue-500/20">
                eB
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white">eBay Marketplace</h4>
                    <p className="text-[10px] text-slate-400">Best for global reaches & specific auctions</p>
                  </div>
                  
                  <button
                    onClick={() => handleToggleChannel("ebay")}
                    disabled={loadingChannel === "ebay"}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                      channels.ebay 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-900"
                    }`}
                  >
                    {loadingChannel === "ebay" ? "Listing..." : channels.ebay ? "● Connected (Live)" : "Connect Listing"}
                  </button>
                </div>

                {channels.ebay && item.platformTips?.ebay && (
                  <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-850 text-[10px] text-slate-400 space-y-1">
                    <span className="font-bold text-teal-400 font-mono uppercase text-[9px]">💡 Smart Tip for eBay:</span>
                    <p className="leading-relaxed">{item.platformTips.ebay}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Channel Item: Facebook Marketplace */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-start gap-4 transition-all col-span-1">
              <div className="h-10 w-10 flex-shrink-0 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center font-black font-mono text-sm border border-indigo-500/20">
                FB
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white">Facebook Marketplace</h4>
                    <p className="text-[10px] text-slate-400">Perfect for local city buy-and-sell groups</p>
                  </div>
                  
                  <button
                    onClick={() => handleToggleChannel("facebook")}
                    disabled={loadingChannel === "facebook"}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                      channels.facebook 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-900"
                    }`}
                  >
                    {loadingChannel === "facebook" ? "Listing..." : channels.facebook ? "● Connected (Live)" : "Connect Listing"}
                  </button>
                </div>

                {channels.facebook && item.platformTips?.facebookMarketplace && (
                  <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-850 text-[10px] text-slate-400 space-y-1">
                    <span className="font-bold text-teal-400 font-mono uppercase text-[9px]">💡 Smart Tip for Facebook:</span>
                    <p className="leading-relaxed">{item.platformTips.facebookMarketplace}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Channel Item: OfferUp */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-start gap-4 transition-all">
              <div className="h-10 w-10 flex-shrink-0 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center font-black font-mono text-sm border border-emerald-500/20">
                OU
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white">OfferUp App</h4>
                    <p className="text-[10px] text-slate-400">Great local mobile buyers app with bidding options</p>
                  </div>
                  
                  <button
                    onClick={() => handleToggleChannel("offerup")}
                    disabled={loadingChannel === "offerup"}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                      channels.offerup 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-900"
                    }`}
                  >
                    {loadingChannel === "offerup" ? "Listing..." : channels.offerup ? "● Connected (Live)" : "Connect Listing"}
                  </button>
                </div>

                {channels.offerup && item.platformTips?.offerup && (
                  <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-850 text-[10px] text-slate-400 space-y-1">
                    <span className="font-bold text-teal-400 font-mono uppercase text-[9px]">💡 Smart Tip for OfferUp:</span>
                    <p className="leading-relaxed">{item.platformTips.offerup}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Channel Item: Nextdoor */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-start gap-4 transition-all">
              <div className="h-10 w-10 flex-shrink-0 bg-teal-500/10 text-teal-400 rounded-lg flex items-center justify-center font-black font-mono text-sm border border-teal-500/20">
                ND
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white">Nextdoor Neighborhood</h4>
                    <p className="text-[10px] text-slate-400">List locally specifically within your close community</p>
                  </div>
                  
                  <button
                    onClick={() => handleToggleChannel("nextdoor")}
                    disabled={loadingChannel === "nextdoor"}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                      channels.nextdoor 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-900"
                    }`}
                  >
                    {loadingChannel === "nextdoor" ? "Listing..." : channels.nextdoor ? "● Connected (Live)" : "Connect Listing"}
                  </button>
                </div>

                {channels.nextdoor && item.platformTips?.nextdoor && (
                  <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-850 text-[10px] text-slate-400 space-y-1">
                    <span className="font-bold text-teal-400 font-mono uppercase text-[9px]">💡 Smart Tip for Nextdoor:</span>
                    <p className="leading-relaxed">{item.platformTips.nextdoor}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* Store Direct REST APIs configuration */
          <div className="space-y-5 animate-fade-in">
            
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-400"></span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Store Destination</span>
                </div>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => { setActiveApiPlatform("shopify"); setApiSuccessMsg(""); setApiErrorMsg(""); }}
                    className={`text-[10px] px-2.5 py-1 rounded font-mono font-bold transition-all cursor-pointer ${
                      activeApiPlatform === "shopify"
                        ? "bg-teal-500/10 text-teal-400 border border-teal-500/25"
                        : "bg-slate-950 text-slate-500 border border-slate-900"
                    }`}
                  >
                    Shopify Admin API
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveApiPlatform("woocommerce"); setApiSuccessMsg(""); setApiErrorMsg(""); }}
                    className={`text-[10px] px-2.5 py-1 rounded font-mono font-bold transition-all cursor-pointer ${
                      activeApiPlatform === "woocommerce"
                        ? "bg-teal-500/10 text-teal-400 border border-teal-500/25"
                        : "bg-slate-950 text-slate-500 border border-slate-900"
                    }`}
                  >
                    WooCommerce REST API
                  </button>
                </div>
              </div>

              {activeApiPlatform === "shopify" ? (
                /* Shopify Inputs */
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Shopify Store URL Domain</label>
                    <input
                      type="text"
                      placeholder="e.g. brand-name.myshopify.com"
                      value={shopifyDomain}
                      onChange={(e) => setShopifyDomain(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-650 outline-none focus:border-teal-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Admin Access Token</label>
                    <input
                      type="password"
                      placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                      value={shopifyToken}
                      onChange={(e) => setShopifyToken(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-650 outline-none focus:border-teal-500 font-mono"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-1.5">
                    <p className="text-[9px] text-slate-500 max-w-xs font-mono">
                      🔑 Create custom app keys inside Shopify Admin Dashboard / Settings / App Development settings.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSaveCredentials("shopify")}
                      className="px-3 py-1 rounded bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-900 hover:text-white transition-all font-mono text-[10px] font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save Key</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* WooCommerce Inputs */
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">WooCommerce Site Base URL</label>
                    <input
                      type="text"
                      placeholder="e.g. https://yourdomain.com"
                      value={wooUrl}
                      onChange={(e) => setWooUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-650 outline-none focus:border-teal-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Consumer Key</label>
                      <input
                        type="text"
                        placeholder="ck_xxxxxxxxxxxxxxxxxxxxxx"
                        value={wooKey}
                        onChange={(e) => setWooKey(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-650 outline-none focus:border-teal-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Consumer Secret</label>
                      <input
                        type="password"
                        placeholder="cs_xxxxxxxxxxxxxxxxxxxxxx"
                        value={wooSecret}
                        onChange={(e) => setWooSecret(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-650 outline-none focus:border-teal-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1.5">
                    <p className="text-[9px] text-slate-500 max-w-xs font-mono">
                      🗝️ Generate key pairs inside WooCommerce settings / Advanced / REST API tab of your WordPress Admin dashboard.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSaveCredentials("woocommerce")}
                      className="px-3 py-1 rounded bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-900 hover:text-white transition-all font-mono text-[10px] font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save Key</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sandbox Toggle */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-center justify-between text-xs">
              <div className="space-y-1 pr-6">
                <h4 className="font-bold text-white flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Sandbox Demonstration Mode</span>
                </h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Toggle off to execute real API requests. Toggle on to safely debug product data structures with our simulated store webhook logs.
                </p>
              </div>

              <button
                onClick={() => setSandboxMode(!sandboxMode)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                  sandboxMode ? "bg-teal-500" : "bg-slate-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    sandboxMode ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* API Trigger Panel */}
            <div className="pt-2 text-center space-y-3.5">
              <button
                type="button"
                onClick={handleExportToApi}
                disabled={isExporting}
                className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-3 rounded-xl transition-all font-mono text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/10 disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                <span>
                  {isExporting 
                    ? `Publishing to ${activeApiPlatform === "shopify" ? "Shopify..." : "WooCommerce..."}` 
                    : `Publish "${item.title}" Item as Draft Draft`}
                </span>
              </button>

              {/* Success Response Block */}
              {apiSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-left space-y-3 animate-fade-in">
                  <div className="flex gap-2 text-xs text-emerald-400 font-bold items-center font-mono">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{apiSuccessMsg}</span>
                  </div>
                  {apiProductLink && (
                    <a
                      href={apiProductLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-teal-400 hover:text-teal-300 font-mono font-bold hover:underline"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Configure pricing, inventory inside your store &rarr;</span>
                    </a>
                  )}
                </div>
              )}

              {/* Error Response Block */}
              {apiErrorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-left flex items-start gap-3 text-xs text-rose-400 font-mono animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span className="leading-relaxed">{apiErrorMsg}</span>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Messaging Simulation Panel */}
      <div className="lg:col-span-5 flex flex-col justify-between border-l border-slate-900 lg:pl-6 space-y-6">
        
        <div>
          <h3 className="text-xs font-black text-white uppercase font-mono tracking-wider">Inquiries Console</h3>
          <p className="text-[10px] text-slate-500">Live mock chats with potential consumers</p>
        </div>

        {/* Chat History Box */}
        <div className="flex-1 min-h-[300px] max-h-[350px] bg-slate-950 rounded-xl border border-slate-850 p-4 overflow-y-auto space-y-3 flex flex-col scrollbar-thin">
          {messages.map((m, idx) => (
            <div 
              key={idx}
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-normal ${
                m.isUser
                  ? "bg-teal-500 text-slate-950 ml-auto rounded-tr-none"
                  : m.sender === "System Notification" || m.sender === "System API Integration"
                  ? "bg-slate-900 border border-teal-500/30 text-teal-400 mx-auto text-center font-mono text-[9px]"
                  : "bg-slate-900 text-white mr-auto rounded-tl-none border border-slate-850"
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-850 pb-1 mb-1 opacity-80 text-[9px]">
                <span className="font-bold">{m.sender}</span>
                <span className="font-mono">{m.time}</span>
              </div>
              <p>{m.text}</p>
            </div>
          ))}
        </div>

        {/* Messaging Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            placeholder="Type your offer reply..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500 font-mono"
          />
          <button
            type="submit"
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center font-mono"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
}
