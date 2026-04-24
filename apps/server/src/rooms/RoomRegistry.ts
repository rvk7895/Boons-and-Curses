import type { GameState } from "@bc/shared";

export type RoomRuntime = {
  id: string;
  code: string;
  state: GameState | null;
  connectedSockets: Set<string>;
};

export class RoomRegistry {
  private byId = new Map<string, RoomRuntime>();
  private byCode = new Map<string, RoomRuntime>();

  upsert(id: string, code: string): RoomRuntime {
    const existing = this.byId.get(id);
    if (existing) return existing;
    const rt: RoomRuntime = { id, code, state: null, connectedSockets: new Set() };
    this.byId.set(id, rt);
    this.byCode.set(code, rt);
    return rt;
  }

  getById(id: string): RoomRuntime | null {
    return this.byId.get(id) ?? null;
  }

  getByCode(code: string): RoomRuntime | null {
    return this.byCode.get(code) ?? null;
  }

  remove(id: string): void {
    const rt = this.byId.get(id);
    if (!rt) return;
    this.byId.delete(id);
    this.byCode.delete(rt.code);
  }

  setState(id: string, state: GameState): void {
    const rt = this.byId.get(id);
    if (!rt) return;
    rt.state = state;
  }

  count(): number {
    return this.byId.size;
  }
}
