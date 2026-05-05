import { useState, useMemo } from "react";
import { ShoppingCart, Package, Tags, ArrowRight, AlertTriangle, LogOut, CheckCircle2, Factory, Coins as SC_Icon, Globe } from "lucide-react";
import { GalaxyIcon } from "./ResourceIcon";
import type { GalaxyApp } from "../useGalaxyApp";
import { RESOURCE_META } from "../meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function MarketView({ app, onPlayClick }: { app: GalaxyApp; onPlayClick: () => void }) {
  const [activeTab, setActiveTab] = useState<"global" | "personal">("global");

  const myUserId = app.user?.id;
  
  const globalListings = useMemo(() => 
    app.marketListings.filter(l => l.sellerId !== myUserId && l.status === 'active'),
    [app.marketListings, myUserId]
  );

  const myListings = useMemo(() => 
    app.marketListings.filter(l => l.sellerId === myUserId),
    [app.marketListings, myUserId]
  );

  // Buy State
  const [buyAmounts, setBuyAmounts] = useState<Record<string, number>>({});

  const handleBuy = (listingId: string, max: number) => {
    const amt = buyAmounts[listingId] || 1;
    if (amt <= 0 || amt > max) {
      toast.error("Invalid amount");
      return;
    }
    app.buyMarketListing(listingId, amt);
  };

  // Sell State
  const [sellResource, setSellResource] = useState<string>("");
  const [sellAmount, setSellAmount] = useState<number>(1);
  const [sellPrice, setSellPrice] = useState<number>(100);

  const handleCreateListing = () => {
    if (!sellResource) {
      toast.error("Select a resource to sell");
      return;
    }
    const inv = app.userResources.find(r => r.resourceType === sellResource);
    if (!inv || sellAmount <= 0 || sellAmount > inv.amount) {
      toast.error("Invalid amount");
      return;
    }
    if (sellPrice <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }
    app.createMarketListing(sellResource, sellAmount, sellPrice);
    setSellResource("");
    setSellAmount(1);
    setSellPrice(100);
  };

  return (
    <div className="flex-1 bg-background/40 backdrop-blur-sm p-4 sm:p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-2 duration-500">
      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-primary/20 pb-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
              <ShoppingCart size={32} className="text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display text-white tracking-[0.2em] uppercase text-glow leading-none mb-2">Galactic Market</h1>
              <div className="flex items-center gap-4 text-xs font-mono-hud uppercase tracking-[0.3em] text-muted-foreground">
                <span className="flex items-center gap-1"><SC_Icon size={12} className="text-primary" /> {Math.floor(app.sc).toLocaleString()} SC Available</span>
                <span className="text-primary/20">|</span>
                <span className="flex items-center gap-1"><Package size={12} className="text-primary" /> Cargo: {app.cargoUsed}/{app.cargoCapacity}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-primary/20 pb-px">
          <button
            onClick={() => { onPlayClick?.(); setActiveTab("global"); }}
            className={`px-6 py-3 font-display uppercase tracking-widest text-sm transition-all border-b-2 ${activeTab === "global" ? "border-primary text-primary text-glow" : "border-transparent text-muted-foreground hover:text-primary/60"}`}
          >
            Trade Hub
          </button>
          <button
            onClick={() => { onPlayClick?.(); setActiveTab("personal"); }}
            className={`px-6 py-3 font-display uppercase tracking-widest text-sm transition-all border-b-2 ${activeTab === "personal" ? "border-primary text-primary text-glow" : "border-transparent text-muted-foreground hover:text-primary/60"}`}
          >
            My Escrow
          </button>
        </div>

        {/* Global Market */}
        {activeTab === "global" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-2 mb-6">
              <Globe size={18} className="text-primary" />
              <h2 className="font-display text-lg uppercase tracking-widest text-primary">Active Listings</h2>
            </div>

            {globalListings.length === 0 ? (
              <div className="hud-panel p-12 flex flex-col items-center justify-center text-center opacity-60 border-dashed border-primary/20">
                <ShoppingCart size={32} className="text-primary/40 mb-4" />
                <p className="font-mono-hud text-xs uppercase tracking-widest text-muted-foreground">No active listings available on the global network.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {globalListings.map(listing => {
                  const meta = (RESOURCE_META as any)[listing.resourceType];
                  const buyAmt = buyAmounts[listing.id] || 1;
                  const totalCost = buyAmt * listing.pricePerUnit;
                  const canAfford = app.sc >= totalCost;
                  const canFit = (app.cargoUsed + buyAmt) <= app.cargoCapacity;

                  return (
                    <div key={listing.id} className="hud-panel p-4 border border-primary/20 bg-primary/5 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded" style={{ color: meta?.color }}>
                            <GalaxyIcon name={meta?.icon} className="w-8 h-8" />
                          </div>
                          <div>
                            <div className="font-display text-sm uppercase tracking-widest text-primary">{listing.resourceType}</div>
                            <div className="font-mono-hud text-[10px] text-muted-foreground uppercase">From Commander: {listing.sellerId.substring(0, 6)}...</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-background/50 p-2 border border-primary/10 rounded">
                        <div>
                          <div className="text-[9px] font-mono-hud text-muted-foreground uppercase">Available</div>
                          <div className="text-xs font-bold text-info">{listing.amountRemaining.toLocaleString()} units</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-mono-hud text-muted-foreground uppercase">Price / Unit</div>
                          <div className="text-xs font-bold text-success flex items-center justify-end gap-1"><SC_Icon size={10} /> {listing.pricePerUnit.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center mt-auto">
                        <div className="flex-1 bg-background/50 border border-primary/20 rounded px-2 py-1 flex items-center justify-between">
                          <span className="text-[10px] font-mono-hud text-muted-foreground uppercase">Qty</span>
                          <input 
                            type="number" 
                            min="1" 
                            max={listing.amountRemaining} 
                            value={buyAmt}
                            onChange={(e) => setBuyAmounts({...buyAmounts, [listing.id]: parseInt(e.target.value) || 1})}
                            className="bg-transparent text-right w-16 text-primary font-bold outline-none text-xs"
                          />
                        </div>
                        <Button 
                          onClick={() => { onPlayClick?.(); handleBuy(listing.id, listing.amountRemaining); }}
                          disabled={!canAfford || !canFit}
                          className="flex-1"
                          variant="default"
                          size="sm"
                        >
                          Buy ({totalCost})
                        </Button>
                      </div>
                      {(!canAfford || !canFit) && (
                        <div className="text-[9px] font-mono-hud text-error uppercase text-center mt-1 flex justify-center items-center gap-1">
                          <AlertTriangle size={10} />
                          {!canAfford ? "Insufficient Funds" : "Insufficient Cargo Space"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Personal Market */}
        {activeTab === "personal" && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Create Listing */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <Tags size={18} className="text-primary" />
                <h2 className="font-display text-lg uppercase tracking-widest text-primary">Create Listing</h2>
              </div>
              
              <div className="hud-panel p-6 border border-primary/20 bg-primary/5">
                {app.userResources.length === 0 ? (
                  <div className="text-center p-8 opacity-60">
                    <Package size={24} className="mx-auto mb-2 text-primary/40" />
                    <p className="font-mono-hud text-xs uppercase text-muted-foreground">Your cargo hold is empty.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono-hud text-muted-foreground uppercase">Select Resource</label>
                      <select 
                        className="w-full bg-background border border-primary/20 rounded px-3 py-2 text-primary text-sm uppercase font-bold outline-none"
                        value={sellResource}
                        onChange={(e) => {
                          setSellResource(e.target.value);
                          setSellAmount(1);
                        }}
                      >
                        <option value="">-- Choose Cargo --</option>
                        {app.userResources.map(r => (
                          <option key={r.resourceType} value={r.resourceType}>
                            {r.resourceType} ({r.amount})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono-hud text-muted-foreground uppercase">Amount to Sell</label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          min="1" 
                          max={sellResource ? app.userResources.find(r => r.resourceType === sellResource)?.amount || 1 : 1}
                          value={sellAmount}
                          onChange={(e) => setSellAmount(parseInt(e.target.value) || 1)}
                          className="bg-background border border-primary/20 text-primary font-bold pr-12"
                        />
                        <button 
                          onClick={() => {
                            const max = app.userResources.find(r => r.resourceType === sellResource)?.amount || 1;
                            setSellAmount(max);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase text-primary/60 hover:text-primary transition-colors"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono-hud text-muted-foreground uppercase">Price per Unit (SC)</label>
                      <Input 
                        type="number" 
                        min="1" 
                        value={sellPrice}
                        onChange={(e) => setSellPrice(parseInt(e.target.value) || 1)}
                        className="bg-background border border-success/30 text-success font-bold"
                      />
                    </div>

                    <Button onClick={() => { onPlayClick?.(); handleCreateListing(); }} className="w-full" disabled={!sellResource}>
                      Post Listing
                    </Button>
                  </div>
                )}
                
                {sellResource && (
                  <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded flex items-center justify-between">
                    <span className="font-mono-hud text-[10px] text-muted-foreground uppercase">Total Expected Revenue:</span>
                    <span className="font-display text-success flex items-center gap-1"><SC_Icon size={12} /> {(sellAmount * sellPrice).toLocaleString()} SC</span>
                  </div>
                )}
              </div>
            </section>

            {/* My Active Listings */}
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <ArrowRight size={18} className="text-primary" />
                <h2 className="font-display text-lg uppercase tracking-widest text-primary">My Escrow</h2>
              </div>

              {myListings.length === 0 ? (
                <div className="hud-panel p-8 text-center border border-dashed border-primary/20 opacity-60">
                  <span className="font-mono-hud text-[10px] uppercase text-muted-foreground italic">No resources currently in escrow.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {myListings.map(listing => {
                    const meta = (RESOURCE_META as any)[listing.resourceType];
                    const isSold = listing.amountRemaining === 0 || listing.status === 'sold';
                    const isCancelled = listing.status === 'cancelled';
                    return (
                      <div key={listing.id} className={`p-4 border rounded flex items-center justify-between ${isSold ? 'bg-success/5 border-success/20' : isCancelled ? 'bg-muted/5 border-muted/20' : 'bg-primary/5 border-primary/20'}`}>
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 p-2 rounded" style={{ color: meta?.color }}>
                            <GalaxyIcon name={meta?.icon} className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-display text-sm uppercase tracking-widest text-primary">{listing.resourceType}</div>
                            <div className="font-mono-hud text-[10px] text-muted-foreground uppercase flex gap-4">
                              <span>Total: {listing.amount}</span>
                              <span className={isSold ? "text-success" : "text-info"}>Remaining: {listing.amountRemaining}</span>
                              <span className="text-success flex items-center gap-1"><SC_Icon size={8} /> {listing.pricePerUnit} / unit</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          {listing.status === 'active' ? (
                            <button 
                              onClick={() => { onPlayClick?.(); app.cancelMarketListing(listing.id); }}
                              className="px-3 py-1.5 border border-error/40 text-error hover:bg-error/10 transition-all rounded text-[10px] uppercase font-bold tracking-widest flex items-center gap-1"
                            >
                              <LogOut size={12} /> Cancel & Refund
                            </button>
                          ) : (
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${isSold ? 'bg-success/20 text-success' : 'bg-muted/20 text-muted-foreground'}`}>
                              {listing.status}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        )}

      </div>
    </div>
  );
}
