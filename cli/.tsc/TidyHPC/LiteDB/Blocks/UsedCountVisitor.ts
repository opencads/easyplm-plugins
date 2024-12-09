import { StatisticalBlock } from "./StatisticalBlock";
import { Database } from "../Database";
import { Type } from "../../../System/Type";
export class UsedCountVisitor {
    public Write(table?: Database, onBuffer?: (()=>number)): Promise<void> {
        return {} as any;
    }
    public Update(table?: Database, onBuffer?: (()=>any)): Promise<void> {
        return {} as any;
    }
    public ToString(): string {
        return {} as any;
    }
    public GetType(): Type {
        return {} as any;
    }
    public Equals(obj?: any): boolean {
        return {} as any;
    }
    public GetHashCode(): number {
        return {} as any;
    }
    public constructor(block?: StatisticalBlock) {
    }
    public get Block(): StatisticalBlock {
        return {} as any;
    }
}