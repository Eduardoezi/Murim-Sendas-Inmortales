import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Item, AuctionListing } from '../types/game';
import { Gavel, ShoppingBag, Plus, Award, ChevronRight } from 'lucide-react';

interface AuctionHouseViewProps {
  onNavigateToMerits?: () => void;
}

export const AuctionHouseView: React.FC<AuctionHouseViewProps> = ({ onNavigateToMerits }) => {
  const { cultivator, auctionListings, placeBid, buyoutAuction, createAuctionListing } = useGame();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'stones' | 'merits'>('all');
  const [showListingModal, setShowListingModal] = useState<boolean>(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<Item | null>(null);
  const [listingCurrency, setListingCurrency] = useState<'stones' | 'merits'>('stones');
  const [startBidPrice, setStartBidPrice] = useState<number>(50);
  const [buyoutPrice, setBuyoutPrice] = useState<number>(100);

  if (!cultivator) return null;

  const filteredListings = auctionListings.filter((listing) => {
    const matchesCategory = filterCategory === 'all' || listing.item.category === filterCategory;
    const itemCurrency = listing.currencyType || 'stones';
    const matchesCurrency = currencyFilter === 'all' || itemCurrency === currencyFilter;
    return matchesCategory && matchesCurrency;
  });

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventoryItem) return;
    createAuctionListing(selectedInventoryItem, startBidPrice, buyoutPrice, listingCurrency);
    setShowListingModal(false);
    setSelectedInventoryItem(null);
  };

  const handlePlaceBid = (listing: AuctionListing) => {
    const amount = listing.currentBid + 20;
    placeBid(listing.id, amount);
  };

  const rarityColors: Record<string, string> = {
    Común: 'text-stone-300 border-stone-700',
    Mortal: 'text-stone-300 border-stone-700',
    Raro: 'text-sky-400 border-sky-600/50',
    Tierra: 'text-amber-300 border-amber-600/50',
    Alma: 'text-purple-400 border-purple-600/50',
    Místico: 'text-purple-400 border-purple-600/50',
    Legendario: 'text-amber-400 border-amber-500/50',
    Celestial: 'text-rose-400 border-rose-500/50',
    Primordial: 'text-yellow-300 border-yellow-500/50',
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-900/80 min-h-[170px] flex items-end p-6">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/murim_auction_hall_1792518334839.jpg"
            alt="Pabellón de Subastas del Jianghu"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-35 brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080a0f] via-[#080a0f]/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs text-amber-400 font-cinzel mb-1">
              天寶閣 · Pabellón de los Cien Tesoros
            </div>
            <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-amber-100">
              Casa de Subastas de Cultivadores
            </h2>
            <p className="text-xs text-stone-300 mt-1 max-w-xl">
              Comercia artefactos raros, armas milenarias y píldoras celestiales utilizando tanto Piedras Espirituales como tus Puntos de Mérito acumulados en el Tablón de Logros.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onNavigateToMerits && (
              <button
                onClick={onNavigateToMerits}
                className="px-4 py-2.5 bg-stone-900/90 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>Tablón de Méritos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => setShowListingModal(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-900/30"
            >
              <Plus className="w-4 h-4" />
              <span>Subastar un Objeto Propio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Balances */}
      <div className="space-y-3 pb-2 border-b border-stone-800">
        {/* Currency Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'Todos los Lotes' },
              { id: 'stones', label: 'Subasta de Piedras Espirituales' },
              { id: 'merits', label: 'Cámara de Tesoros por Méritos' },
            ].map((cur) => (
              <button
                key={cur.id}
                onClick={() => setCurrencyFilter(cur.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  currencyFilter === cur.id
                    ? 'bg-amber-950/70 border border-amber-500 text-amber-200'
                    : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                {cur.label}
              </button>
            ))}
          </div>

          {/* User Balances */}
          <div className="flex items-center gap-4 text-xs bg-stone-950 px-3.5 py-1.5 rounded-lg border border-stone-800">
            <div>
              <span className="text-stone-400">Piedras: </span>
              <span className="font-mono text-emerald-400 font-bold tabular-nums">
                {cultivator.spiritStones}
              </span>
            </div>
            <div className="w-[1px] h-4 bg-stone-800" />
            <div>
              <span className="text-stone-400">Méritos: </span>
              <span className="font-mono text-amber-300 font-bold tabular-nums">
                {cultivator.sectMerits}
              </span>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'weapon', 'armor', 'artifact', 'pill', 'manual'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterCategory === cat
                  ? 'bg-stone-800 text-amber-300'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              {cat === 'all'
                ? 'Todas las categorías'
                : cat === 'weapon'
                ? 'Armas'
                : cat === 'armor'
                ? 'Túnicas & Armaduras'
                : cat === 'artifact'
                ? 'Talismanes'
                : cat === 'pill'
                ? 'Elixires'
                : 'Manuales'}
            </button>
          ))}
        </div>
      </div>

      {/* Auction Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="p-12 text-center bg-stone-900/40 border border-stone-800 rounded-xl text-stone-400 text-xs">
          No hay lotes disponibles con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((listing) => {
            const isMerit = listing.currencyType === 'merits';
            const isHighestBidder = listing.highestBidderId === cultivator.id;
            const currentBid = listing.currentBid;
            const canAffordBuyout = isMerit
              ? cultivator.sectMerits >= listing.buyoutPrice
              : cultivator.spiritStones >= listing.buyoutPrice;
            const canAffordBid = isMerit
              ? cultivator.sectMerits > currentBid
              : cultivator.spiritStones > currentBid;

            return (
              <div
                key={listing.id}
                className={`border rounded-xl p-5 flex flex-col justify-between transition-colors ${
                  isMerit
                    ? 'bg-gradient-to-b from-amber-950/20 to-stone-900/80 border-amber-600/40'
                    : 'bg-stone-900/70 border-stone-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-stone-100">{listing.item.name}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        rarityColors[listing.item.rarity] || 'text-stone-300'
                      }`}
                    >
                      {listing.item.rarity}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-400 mb-3 leading-relaxed">
                    {listing.item.description}
                  </p>

                  <div className="text-[10px] text-stone-500 mb-4 flex items-center justify-between">
                    <span>Vendedor: {listing.sellerName}</span>
                    {listing.item.element && (
                      <span className="text-amber-400 font-mono">Afinidad {listing.item.element}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-stone-800">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-stone-500 uppercase flex items-center gap-1">
                        <span>Puja Actual</span>
                        {isMerit && <span className="text-amber-400 font-bold">(Méritos)</span>}
                      </div>
                      <div
                        className={`font-mono font-bold tabular-nums ${
                          isMerit ? 'text-amber-300' : 'text-stone-200'
                        }`}
                      >
                        {currentBid} {isMerit ? 'Méritos' : 'Piedras'}
                      </div>
                      {isHighestBidder && (
                        <span className="text-[10px] text-emerald-400 font-medium">
                          ¡Eres el mejor postor!
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-stone-500 uppercase flex items-center justify-end gap-1">
                        <span>Compra Directa</span>
                      </div>
                      <div
                        className={`font-mono font-bold tabular-nums ${
                          isMerit ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {listing.buyoutPrice} {isMerit ? 'Méritos' : 'Piedras'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePlaceBid(listing)}
                      disabled={!canAffordBid}
                      className="flex-1 py-1.5 px-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Gavel className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pujar (+20)</span>
                    </button>

                    <button
                      onClick={() => buyoutAuction(listing.id)}
                      disabled={!canAffordBuyout}
                      className={`flex-1 py-1.5 px-2 font-bold text-xs rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 ${
                        isMerit
                          ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-stone-950'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Comprar Ya</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Listing Modal */}
      {showListingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-cinzel text-base font-bold text-amber-100 mb-1">
              Listar un Objeto en Subasta
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Selecciona un artículo de tu alforja y define los precios de puja y venta inmediata.
            </p>

            <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-300 mb-1 font-medium">
                  Elige el objeto a comerciar
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1 bg-stone-950 p-2 rounded-lg border border-stone-800">
                  {cultivator.inventory.map((invItem) => (
                    <button
                      key={invItem.id}
                      type="button"
                      onClick={() => {
                        setSelectedInventoryItem(invItem);
                        setStartBidPrice(Math.floor(invItem.value * 0.7));
                        setBuyoutPrice(invItem.value);
                      }}
                      className={`w-full text-left p-2 rounded text-xs flex items-center justify-between cursor-pointer ${
                        selectedInventoryItem?.id === invItem.id
                          ? 'bg-amber-950/60 border border-amber-500 text-amber-200'
                          : 'hover:bg-stone-900 text-stone-300'
                      }`}
                    >
                      <span>{invItem.name}</span>
                      <span className="text-[10px] text-amber-400 font-mono">
                        Val: {invItem.value} P
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency type selection */}
              <div>
                <label className="block text-stone-300 mb-1 font-medium">
                  Moneda de Cobro
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setListingCurrency('stones')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                      listingCurrency === 'stones'
                        ? 'bg-stone-800 border-emerald-500 text-emerald-300'
                        : 'bg-stone-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    Piedras Espirituales
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingCurrency('merits')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                      listingCurrency === 'merits'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                        : 'bg-stone-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    Puntos de Mérito
                  </button>
                </div>
              </div>

              {selectedInventoryItem && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-300 mb-1 font-medium">
                      Puja Inicial ({listingCurrency === 'merits' ? 'Méritos' : 'Piedras'})
                    </label>
                    <input
                      type="number"
                      min="10"
                      value={startBidPrice}
                      onChange={(e) => setStartBidPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-amber-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-300 mb-1 font-medium">
                      Compra Directa
                    </label>
                    <input
                      type="number"
                      min={startBidPrice + 10}
                      value={buyoutPrice}
                      onChange={(e) => setBuyoutPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-emerald-400 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowListingModal(false)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 hover:bg-stone-700 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedInventoryItem}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold rounded-lg cursor-pointer"
                >
                  Publicar en Subasta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
