"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import loginHero from "@/src/assets/images/login_hero_1779987568844.png";
import { useAuth } from "@/lib/firebaseContext";
import { ListingItem } from "@/components/ListingTypes";
import DashboardTab from "@/components/DashboardTab";
import BatchProcessor from "@/components/BatchProcessor";
import BillingSuite from "@/components/BillingSuite";
import ItemDetailsForm from "@/components/ItemDetailsForm";
import StudioWorkspace from "@/components/StudioWorkspace";
import ChannelManager from "@/components/ChannelManager";

import { 
  Sparkles, LogOut, Layers, Package, Zap, User, HelpCircle, 
  Menu, X, Check, RefreshCw, Smartphone, Laptop, Settings, Clock 
} from "lucide-react";

export default function HomePage() {
  const {
    user,
    isAdmin,
    loading,
    isFirebaseSetup,
    listings,
    subStatus,
    loginWithGoogle,
    simulateEmailLogin,
    logout,
    saveListing,
    deleteListing,
    updateSubStatus,
    addBatchListings,
  } = useAuth();

  // Navigation states
  const [activeTab, setActiveTab] = useState<"catalog" | "bulk" | "billing">("catalog");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication Email simulator state
  const [altEmail, setAltEmail] = useState("");
  const [authError, setAuthError] = useState("");

  // Secondary sub-views for operating a specific listing
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);
  const [activeSuite, setActiveSuite] = useState<"edit" | "channels" | "studio" | null>(null);

  // Manual creation states
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Subscription modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Auto synchronizer states (per requested toggle for channels)
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState(15); // minutes
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("Never");

  // Simulated auto sync intervals
  useEffect(() => {
    if (!isAutoSyncEnabled) return;

    // Simulate database updates every few seconds to reflect actual periodically refreshed listings
    const intervalTimer = setInterval(() => {
      setIsSyncing(true);
      setTimeout(() => {
        setIsSyncing(false);
        setLastSyncedTime(new Date().toLocaleTimeString());
      }, 1500);
    }, syncInterval * 1000); // map minutes to seconds so user can see it live!

    return () => clearInterval(intervalTimer);
  }, [isAutoSyncEnabled, syncInterval]);

  const handleSimulateSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncedTime(new Date().toLocaleTimeString());
    }, 1200);
  };

  const handleEmailLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!altEmail.trim()) {
      setAuthError("Email addresses cannot be empty!");
      return;
    }
    const emailLower = altEmail.trim().toLowerCase();
    
    // Support Enterprise infinite usage login or general email simulation logins
    simulateEmailLogin(emailLower);
  };

  const handleSelectItem = (item: ListingItem, suite: "edit" | "channels" | "studio") => {
    setSelectedItem(item);
    setActiveSuite(suite);
  };

  const handleCloseSubSuite = () => {
    setSelectedItem(null);
    setActiveSuite(null);
    setIsCreatingNew(false);
  };

  const handleSaveListing = async (updated: ListingItem) => {
    await saveListing(updated);
    handleCloseSubSuite();
  };

  const handleAddBatch = async (items: ListingItem[]) => {
    await addBatchListings(items);
    setActiveTab("catalog");
  };

  // Render Loader if auth context is checking firebase active links
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
        <p className="text-xs font-mono text-slate-550 uppercase tracking-widest">Checking reseller session...</p>
      </div>
    );
  }

  // LOGIN GATE SCREEN
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row relative overflow-hidden">
        
        {/* Left side: Premium, Clean Login Portal */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:px-16 lg:px-24 z-10 w-full md:max-w-xl bg-slate-950/80 backdrop-blur-md border-r border-slate-900">
          
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-mono text-[10px] uppercase tracking-wider font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Reseller Workspace</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none font-display">
                Marketeer
              </h1>
              <p className="text-sm text-slate-405 leading-relaxed">
                Refine, price, and curate your product photos. Instantly distribute listings across multi-channel marketplaces.
              </p>
            </div>

            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl text-xs text-rose-400 font-mono text-center">
                {authError}
              </div>
            )}

            <div className="space-y-6">
              <form onSubmit={handleEmailLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-widest block">
                    Access Code or E-Mail
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your reseller email address..."
                    value={altEmail}
                    onChange={(e) => {
                      setAltEmail(e.target.value);
                      setAuthError("");
                    }}
                    className="w-full bg-slate-900/65 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/25 transition-all font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-450 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20"
                >
                  Unveil Workspace
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-900"></div>
                <span className="flex-shrink mx-3 text-[9px] font-mono text-slate-500 uppercase tracking-widest">Or access session via provider</span>
                <div className="flex-grow border-t border-slate-900"></div>
              </div>

              <button
                onClick={loginWithGoogle}
                className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-750 text-slate-200 text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-2.5 hover:bg-slate-850"
              >
                <span>Continue secure session with Google</span>
              </button>
            </div>

            <div className="pt-6 border-t border-slate-900/60">
              <p className="text-[10px] text-slate-550 leading-relaxed font-mono">
                Safe, sandboxed authentication portal. No password required for initial workspace preview access.
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Interactive, Immersive Hero panel with the generated image */}
        <div className="hidden md:flex flex-1 relative bg-slate-900 items-center justify-center p-12 overflow-hidden">
          
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full filter blur-[150px] mix-blend-screen pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-550/5 rounded-full filter blur-[150px] mix-blend-screen pointer-events-none" />

          {/* Luxury artwork image container */}
          <div className="relative w-full h-full max-w-2xl max-h-[85%] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-indigo-950/20 flex items-center justify-center">
            <Image
              src={loginHero}
              alt="Marketeer Luxury Workspace Concept"
              fill
              className="object-cover opacity-85 hover:scale-[1.02] transition-transform duration-700 select-none pointer-events-none"
              sizes="(max-width: 1200px) 100vw, 50vw"
              priority
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-85" />
            
            {/* Elegant Translucent Overlay Panel with Feature Curation highlights */}
            <div className="absolute bottom-8 left-8 right-8 bg-slate-950/50 backdrop-blur-xl border border-white/5 p-6 rounded-2xl text-left space-y-2.5 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-400"></span>
                <span className="text-[10px] font-mono text-teal-400 uppercase tracking-widest font-black animate-pulse">AI Curation Engine Active</span>
              </div>
              <p className="text-white text-base font-extrabold tracking-tight font-display">
                Automate your photo workflows & listing distributions.
              </p>
              <p className="text-slate-300 text-xs font-mono leading-normal">
                High-contrast cropping, seamless background removal, smart multi-tier pricing guides, and scheduled cross-channel deployments.
              </p>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // PRIMARY DASHBOARD AFTER SUCCESSFUL SIGN-IN
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
      
      {/* Dynamic Header */}
      <header className="sticky top-0 bg-slate-900 border-b border-slate-850 z-20 shadow">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5 font-display select-none">
              <Sparkles className="w-5 h-5 text-teal-400 stroke-[2.5]" />
              <span>Marketeer</span>
            </h1>

            {/* Desktop Tabs menu */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => {
                  setActiveTab("catalog");
                  handleCloseSubSuite();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "catalog" && !selectedItem && !isCreatingNew
                    ? "bg-slate-950 text-white font-bold"
                    : "text-slate-450 hover:text-white"
                }`}
              >
                Inventory Catalog
              </button>
              
              <button
                onClick={() => {
                  setActiveTab("bulk");
                  handleCloseSubSuite();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "bulk"
                    ? "bg-slate-950 text-white font-bold"
                    : "text-slate-450 hover:text-white"
                }`}
              >
                Bulk Loader
              </button>

              <button
                onClick={() => {
                  setActiveTab("billing");
                  handleCloseSubSuite();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "billing"
                    ? "bg-slate-950 text-white font-bold"
                    : "text-slate-450 hover:text-white"
                }`}
              >
                Licenses
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Auto Synchronizer Configuration Header Panel */}
            <div className="hidden lg:flex items-center gap-2 border-r border-slate-800 pr-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-450 uppercase tracking-wider">Automated Refresh:</span>
                <button
                  onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                    isAutoSyncEnabled ? "bg-teal-500" : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isAutoSyncEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {isAutoSyncEnabled && (
                <div className="flex items-center gap-1.5 text-[10px] text-teal-400 font-mono animate-fade-in bg-slate-950 px-2 py-0.5 rounded border border-teal-500/10">
                  <Clock className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>Sync every {syncInterval}s</span>
                </div>
              )}
            </div>

            {/* Profile status widget */}
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <p className="text-xs font-black text-white max-w-[120px] truncate">{user.displayName}</p>
                <div className="flex items-center justify-end gap-1">
                  <span className={`text-[8px] font-mono tracking-widest font-black uppercase px-1 rounded ${
                    isAdmin 
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/10" 
                      : "bg-teal-500/10 text-teal-400 border border-teal-500/10"
                  }`}>
                    {subStatus.tier}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                title="Log out of app"
                className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
              </button>
            </div>

            {/* Mobile Menu Icon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 border border-slate-800 hover:border-slate-750 bg-slate-950 hover:bg-slate-900 md:hidden rounded-xl cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
            </button>

          </div>

        </div>
      </header>

      {/* Dynamic Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-850 p-4 space-y-3 animate-fade-in z-20">
          <button
            onClick={() => {
              setActiveTab("catalog");
              handleCloseSubSuite();
              setMobileMenuOpen(false);
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-xs text-left font-bold border transition-all ${
              activeTab === "catalog" && !selectedItem && !isCreatingNew
                ? "bg-teal-500 border-teal-500 text-slate-950 font-black"
                : "border-slate-800 text-slate-400"
            }`}
          >
            Inventory Catalog
          </button>
          
          <button
            onClick={() => {
              setActiveTab("bulk");
              handleCloseSubSuite();
              setMobileMenuOpen(false);
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-xs text-left font-bold border transition-all ${
              activeTab === "bulk"
                ? "bg-teal-500 border-teal-500 text-slate-950 font-black"
                : "border-slate-800 text-slate-400"
            }`}
          >
            Bulk Loader
          </button>

          <button
            onClick={() => {
              setActiveTab("billing");
              handleCloseSubSuite();
              setMobileMenuOpen(false);
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-xs text-left font-bold border transition-all ${
              activeTab === "billing"
                ? "bg-teal-500 border-teal-500 text-slate-950 font-black"
                : "border-slate-800 text-slate-400"
            }`}
          >
            Licenses
          </button>

          {/* Auto Synchronizer toggle inside mobile menu drawer */}
          <div className="p-3 border border-slate-850 bg-slate-950 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Auto Channel Sync</span>
              <button
                onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                  isAutoSyncEnabled ? "bg-teal-500" : "bg-slate-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isAutoSyncEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            {isAutoSyncEnabled && (
              <p className="text-[9px] font-mono text-teal-400">Syncs listings every {syncInterval} seconds for live testing!</p>
            )}
          </div>
        </div>
      )}

      {/* Main Container body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">

        {/* Sync interval diagnostic strip shown in the workspace */}
        {isAutoSyncEnabled && (
          <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-teal-400 font-mono animate-fade-in shadow-inner">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                Auto Sync actively running. Periodical live syncing connected catalogs. Next sync: {syncInterval}s.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>Last Sync Time: <strong className="text-white font-black">{lastSyncedTime}</strong></span>
              <button
                onClick={handleSimulateSyncNow}
                className="px-2.5 py-1 rounded bg-teal-500 hover:bg-teal-450 text-slate-950 font-bold transition-all text-[10px] cursor-pointer"
              >
                Force Sync
              </button>
            </div>
          </div>
        )}

        {/* SUB SUITE PANELS OVER OVERVIEW TABS */}
        {isCreatingNew ? (
          <ItemDetailsForm
            onSave={handleSaveListing}
            onCancel={handleCloseSubSuite}
          />
        ) : selectedItem ? (
          activeSuite === "edit" ? (
            <ItemDetailsForm
              item={selectedItem}
              onSave={handleSaveListing}
              onCancel={handleCloseSubSuite}
            />
          ) : activeSuite === "studio" ? (
            <StudioWorkspace
              item={selectedItem}
              onUpdate={saveListing}
              onBack={handleCloseSubSuite}
            />
          ) : activeSuite === "channels" ? (
            <ChannelManager
              item={selectedItem}
              onUpdate={saveListing}
              onBack={handleCloseSubSuite}
            />
          ) : null
        ) : (
          /* CORE MAIN SYSTEM TABS */
          <>
            {activeTab === "catalog" && (
              <DashboardTab
                items={listings}
                onSelectItem={handleSelectItem}
                onAddNewManual={() => setIsCreatingNew(true)}
                onDeleteItem={deleteListing}
                status={subStatus}
                onShowUpgrade={() => setActiveTab("billing")}
                onSaveListing={saveListing}
              />
            )}

            {activeTab === "bulk" && (
              <BatchProcessor
                onAddBatch={handleAddBatch}
                statusLimit={subStatus.listingsMax}
                statusUsed={subStatus.listingsUsed}
              />
            )}

            {activeTab === "billing" && (
              <BillingSuite
                status={subStatus}
                onUpdateStatus={updateSubStatus}
                onClose={() => setActiveTab("catalog")}
              />
            )}
          </>
        )}

      </main>

      {/* Basic Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center mt-8 font-mono">
        <p className="text-[10px] text-slate-650 leading-normal">
          Marketeer. Reselling workspace platform. All operations are safe and localized.
        </p>
      </footer>

    </div>
  );
}
