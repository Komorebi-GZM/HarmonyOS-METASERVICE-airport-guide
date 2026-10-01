export interface AppPalette { bg: string; card: string; card2: string; line: string; text: string; sub: string; accent: string; accentSoft: string; gold: string; gtext: string; }
export const APP: AppPalette = { bg: '#F4F7F9', card: '#FFFFFF', card2: '#E9F3F2', line: '#DFE7EB', text: '#172B3A', sub: '#657582', accent: '#007F7A', accentSoft: '#D5EEEB', gold: '#B86A12', gtext: '#86500E' };
export interface MapPalette { surface: string; grid: string; ink: string; ink2: string; muted: string; corridor: string; landWash: string; airWash: string; }
export const MAP: MapPalette = { surface: '#F6F8F8', grid: '#EEF2F3', ink: '#172B3A', ink2: '#657582', muted: '#A6B6BF', corridor: '#FFFFFF', landWash: '#EDF2F4', airWash: '#E5F2F0' };
export const TYPE_COLOR: Map<string, string> = new Map<string, string>();
TYPE_COLOR.set('entrance', '#007F7A'); TYPE_COLOR.set('exit', '#007F7A'); TYPE_COLOR.set('checkin', '#486A85'); TYPE_COLOR.set('security', '#B86A12'); TYPE_COLOR.set('gate', '#286DAB');
TYPE_COLOR.set('lift', '#657582'); TYPE_COLOR.set('escalator', '#657582'); TYPE_COLOR.set('stair', '#657582'); TYPE_COLOR.set('metro', '#007F7A'); TYPE_COLOR.set('coach', '#486A85'); TYPE_COLOR.set('parking', '#486A85');
TYPE_COLOR.set('baggage', '#007F7A'); TYPE_COLOR.set('toilet', '#486A85'); TYPE_COLOR.set('hall', '#486A85'); TYPE_COLOR.set('corridor', '#A6B6BF');
export interface RoutePalette { color: string; case: string; trans: string; }
export const ROUTE: RoutePalette = { color: '#007F7A', case: '#FFFFFF', trans: '#B7DBD7' };
export const HIT = '#007F7A';
