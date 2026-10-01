import { MapNode, XHA_NODES } from '../model/AirportMap';
import { nodeName } from '../model/Localization';
import { catOf } from '../model/Categories';
const INDEX: Map<string, MapNode> = new Map<string, MapNode>();
for (let i = 0; i < XHA_NODES.length; i++) { INDEX.set(XHA_NODES[i].id, XHA_NODES[i]); }
const PUBLIC_CORRIDORS: string[] = ['xha_p4_preSec', 'xha_p3_deck', 'xha_p3_kids', 'xha_p1_luggage', 'xha_p1_linkG', 'xha_b1_metroG', 'xha_b2_pasg'];
export function place(id: string): MapNode | undefined { return INDEX.get(id); }
export function placeName(id: string, en: boolean): string { const n = place(id); return n === undefined ? '' : nodeName(n, en); }
export function publicPlace(n: MapNode): boolean { return n.type !== 'corridor' || PUBLIC_CORRIDORS.indexOf(n.id) >= 0; }
export function gateCode(n: MapNode): string { return n.type === 'gate' ? n.name.replace('登机口', '').toLowerCase() : ''; }
export function searchPlaces(query: string, category: string = 'all'): MapNode[] {
  const q = query.trim().toLowerCase(); const out: MapNode[] = [];
  for (let i = 0; i < XHA_NODES.length; i++) {
    const n = XHA_NODES[i];
    if (!publicPlace(n) || (category !== 'all' && catOf(n) !== category)) { continue; }
    if (q.length === 0 || n.name.toLowerCase().indexOf(q) >= 0 || nodeName(n, true).toLowerCase().indexOf(q) >= 0 ||
      (n.type === 'gate' && gateCode(n).indexOf(q) >= 0)) { out.push(n); }
  }
  out.sort((a: MapNode, b: MapNode): number => {
    const exactA = q.length > 0 && gateCode(a) === q ? 0 : 1;
    const exactB = q.length > 0 && gateCode(b) === q ? 0 : 1;
    return exactA - exactB;
  }); return out;
}
export function recentPlaces(ids: string[], id: string): string[] {
  const out: string[] = []; if (place(id) !== undefined) { out.push(id); }
  for (let i = 0; i < ids.length && out.length < 6; i++) {
    if (ids[i] !== id && out.indexOf(ids[i]) < 0 && place(ids[i]) !== undefined) { out.push(ids[i]); }
  } return out;
}
