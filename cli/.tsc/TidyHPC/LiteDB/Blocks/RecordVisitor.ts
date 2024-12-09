import { Block } from "./Block";
import { Database } from "../Database";
import { Type } from "../../../System/Type";
export class RecordVisitor {
    public Read(table?: Database, address?: number, onBuffer?: ((arg0?:number[])=>Promise<void>)): Promise<void> {
        return {} as any;
    }
    public Write(table?: Database, address?: number, onBuffer?: ((arg0?:number[])=>Promise<void>)): Promise<void> {
        return {} as any;
    }
    public WriteSpan(table?: Database, address?: number, spanOffset?: number, spanSize?: number, onBuffer?: ((arg0?:number[])=>Promise<void>)): Promise<void> {
        return {} as any;
    }
    public Update(table?: Database, address?: number, onBuffer?: ((arg0?:number[])=>boolean) | ((arg0?:number[])=>Promise<boolean>)): Promise<void> {
        return {} as any;
    }
    public UpdateSpan(table?: Database, address?: number, spanOffset?: number, spanSize?: number, onBuffer?: ((arg0?:number[])=>Promise<boolean>) | ((arg0?:number[])=>boolean)): Promise<void> {
        return {} as any;
    }
    public UpdateByIndex(table?: Database, index?: number, onBuffer?: ((arg0?:number[])=>boolean) | ((arg0?:number[])=>Promise<boolean>)): Promise<void> {
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