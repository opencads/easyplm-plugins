import { Apis } from "./Apis";
import { Consoles } from "./Consoles";
import { LoggerFile } from "../../../TidyHPC/Loggers/LoggerFile";
import { Type } from "../../../System/Type";
export class context {
    public locate(path?: string): string {
        return {} as any;
    }
    public setLoggerPath(path?: string): void {
        return {} as any;
    }
    public getLoggerPath(): string {
        return {} as any;
    }
    public Dispose(): void {
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
    public constructor() {
    }
    public args: string[];
    public manifest: any;
    public script_path: string;
    public get apis(): Apis {
        return {} as any;
    }
    public get console(): Consoles {
        return {} as any;
    }
    public get Logger(): LoggerFile {
        return {} as any;
    }
}