"use client";

import React, { useState } from "react";
import { SubscriptionStatus } from "./ListingTypes";
import { Check, Star, Shield, Zap, Sparkles } from "lucide-react";

interface BillingSuiteProps {
  status: SubscriptionStatus;
  onUpdateStatus: (updated: SubscriptionStatus) => Promise<void>;
  onClose: () => void;
}

export default function BillingSuite({ status, onUpdateStatus, onClose }: BillingSuiteProps) {
  const [upgradingTo, setUpgradingTo] = useState<string | null>(null);

  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Ideal for testing and beginner home resellers.",
      limit: 5,
      features: [
        "Manage up to 5 items",
        "Pristine AI backgrounds (Simulated)",
        "Single Manual Posting Option",
        "E-Mail Tech Support (Best effort)"
      ],
      icon: Zap
    },
    {
      name: "Pro",
      price: "$19",
      period: "/month",
      description: "Perfect for active side-hustlers and local traders.",
      limit: 250,
      features: [
        "Manage up to 250 items",
        "Pristine AI backgrounds",
        "Multi-channel cross-listing (Automatic)",
        "Priority Customer Support (24 hours)"
      ],
      icon: Star,
      popular: true
    },
    {
      name: "Enterprise",
      price: "$49",
      period: "/month",
      description: "Scale high volume resale stores seamlessly.",
      limit: 999999,
      features: [
        "Manage Unlimited items",
        "Ultimate Fast Processing engine",
        "Full Channel Synchronizers",
        "Premium API Access keys",
        "Personal Support Account Executive"
      ],
      icon: Shield
    }
  ];

  const handleUpgrade = async (tierName: string, limit: number) => {
    setUpgradingTo(tierName);
    const updated: SubscriptionStatus = {
      tier: tierName,
      isActive: tierName !== "Free",
      listingsUsed: status.listingsUsed,
      listingsMax: limit
    };
    
    // Simulate delay for smooth UI feedback
    setTimeout(async () => {
      await onUpdateStatus(updated);
      setUpgradingTo(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      <div className="text-center max-w-lg mx-auto space-y-2">
        <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
          <span>Flexible Reselling Licenses</span>
        </h2>
        <p className="text-xs text-slate-400">
          Supercharge your shop productivity with expanded listing limits. Choose a plan that matches your volumes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-4">
        {plans.map((p) => {
          const isCurrent = status.tier.toLowerCase() === p.name.toLowerCase();
          const IconComponent = p.icon;

          return (
            <div
              key={p.name}
              className={`rounded-2xl border bg-slate-900 overflow-hidden flex flex-col justify-between shadow-xl transition-all ${
                isCurrent 
                  ? "border-emerald-500 shadow-emerald-900/10 ring-1 ring-emerald-500" 
                  : p.popular
                  ? "border-teal-500 shadow-teal-900/10"
                  : "border-slate-850 hover:border-slate-750"
              }`}
            >
              
              {/* Plan Header */}
              <div className="p-5 space-y-4">
                
                <div className="flex items-center justify-between">
                  {p.popular && !isCurrent && (
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-teal-500/10 text-teal-400 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                      Most Popular Plan
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                      Current active license
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                    isCurrent 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : p.popular
                      ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
                      : "bg-slate-950 text-slate-500 border-slate-850"
                  }`}>
                    <IconComponent className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{p.name}</h4>
                    <p className="text-[10px] text-slate-400">Limit: {p.limit > 100000 ? "Unlimited" : `${p.limit} Products`}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-2xl font-black text-white">{p.price}</span>
                  {p.period && <span className="text-xs text-slate-500 font-mono">{p.period}</span>}
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{p.description}</p>
                </div>

              </div>

              {/* Plan Features */}
              <div className="border-t border-slate-850 bg-slate-950/40 p-5 space-y-4 flex-1 flex flex-col justify-between">
                
                <ul className="space-y-2.5">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-normal">
                      <Check className="w-4 h-4 text-teal-450 stroke-[3] mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrent || upgradingTo !== null}
                  onClick={() => handleUpgrade(p.name, p.limit)}
                  className={`w-full py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-slate-950 text-emerald-400 border border-emerald-500/10 font-bold"
                      : upgradingTo === p.name
                      ? "bg-slate-950 text-slate-500 animate-pulse border border-slate-800"
                      : p.popular
                      ? "bg-teal-500 hover:bg-teal-400 text-slate-950 hover:shadow-lg shadow-teal-500/10"
                      : "bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  {isCurrent ? "Active License" : upgradingTo === p.name ? "Changing Plan..." : `Upgrade to ${p.name}`}
                </button>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
