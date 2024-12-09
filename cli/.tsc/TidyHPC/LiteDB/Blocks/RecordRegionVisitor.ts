import { Block } from "./Block";
import { Database } from "../Database";
import { Type } from "../../../System/Type";
export class RecordRegionVisitor {
    public Read(table?: Database, onBuffer?: ((arg0?:number[])=>Promise<void>)): Promise<void> {
        return {} as any;
    }
    public Update(table?: Database, onBuffer?: ((arg0?:number[])=>boolean) | ((arg0?:number[])=>Promise<boolean>)): Promise<void> {
        return {} as any;
    }
    public GetType(): Type {
        return {} as any;
    }
    public ToString(): string {
        return {} as any;
    }
    public Equals(obj?: any): boolean {
        return {} as any;
    }
    public GetHashCode(): number {
        return {} as any;
    }
    public constructor(block?: Block) {
    }
    public get Block(): Block {
        return {} as any;
    }
}