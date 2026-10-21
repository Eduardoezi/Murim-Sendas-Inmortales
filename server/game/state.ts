import { getDb } from '../db';
import { AuctionListing, WorldBossState } from '../../src/types/game';

// ---------- WORLD STATE (clave-valor) ----------
export function loadWorldState<T>(key: string, fallback: T): T {
  const row = getDb()
    .prepare('SELECT value_json FROM world_state WHERE key = ?')
    .get(key) as { value_json: string } | undefined;
  if (!row) return fallback;
  try {
    return JSON.parse(row.value_json) as T;
  } catch {
    return fallback;
  }
}

export function saveWorldState(key: string, value: unknown) {
  getDb()
    .prepare(
      `INSERT INTO world_state (key, value_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value_json = excluded.value_json,
         updated_at = excluded.updated_at`
    )
    .run(key, JSON.stringify(value), Date.now());
}

// ---------- SUBASTAS ----------
function rowToAuction(row: any): AuctionListing {
  return {
    id: row.id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    sellerClass: row.seller_class ?? 'warrior',
    item: JSON.parse(row.item_json),
    currentBid: row.current_bid,
    buyoutPrice: row.buyout_price,
    highestBidderId: row.highest_bidder_id ?? undefined,
    highestBidderName: row.highest_bidder_name ?? undefined,
    expiresAt: row.expires_at,
    currencyType: row.currency_type,
  };
}

export function loadAuctions(): AuctionListing[] {
  const now = Date.now();
  // limpia expiradas al arrancar
  getDb().prepare('DELETE FROM auctions WHERE expires_at <= ?').run(now);
  const rows = getDb()
    .prepare('SELECT * FROM auctions ORDER BY created_at DESC')
    .all() as any[];
  return rows.map(rowToAuction);
}

export function upsertAuction(a: AuctionListing) {
  getDb()
    .prepare(
      `INSERT INTO auctions
         (id, seller_id, seller_name, seller_class, item_json,
          current_bid, buyout_price, highest_bidder_id, highest_bidder_name,
          currency_type, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         current_bid = excluded.current_bid,
         buyout_price = excluded.buyout_price,
         highest_bidder_id = excluded.highest_bidder_id,
         highest_bidder_name = excluded.highest_bidder_name,
         expires_at = excluded.expires_at`
    )
    .run(
      a.id,
      a.sellerId,
      a.sellerName,
      a.sellerClass ?? 'warrior',
      JSON.stringify(a.item),
      a.currentBid,
      a.buyoutPrice,
      a.highestBidderId ?? null,
      a.highestBidderName ?? null,
      a.currencyType ?? 'stones',
      a.expiresAt,
      Date.now()
    );
}

export function deleteAuction(id: string) {
  getDb().prepare('DELETE FROM auctions WHERE id = ?').run(id);
}

/** Borra subastas expiradas y devuelve los IDs eliminados. */
export function expireAuctions(now: number): string[] {
  const rows = getDb()
    .prepare('SELECT id FROM auctions WHERE expires_at <= ?')
    .all(now) as { id: string }[];
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const del = getDb().prepare('DELETE FROM auctions WHERE id = ?');
  const tx = getDb().transaction((list: string[]) => {
    for (const id of list) del.run(id);
  });
  tx(ids);
  return ids;
}

// ---------- LOG DE EVENTOS ----------
export function logEvent(
  type: string,
  data: { actorId?: string; targetId?: string; payload?: unknown; tick?: number } = {}
) {
  getDb()
    .prepare(
      `INSERT INTO world_events (tick, type, actor_id, target_id, data_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.tick ?? 0,
      type,
      data.actorId ?? null,
      data.targetId ?? null,
      data.payload === undefined ? null : JSON.stringify(data.payload),
      Date.now()
    );
}