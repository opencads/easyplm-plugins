import { EncodingProvider } from "./EncodingProvider";
import { EncoderFallback } from "./EncoderFallback";
import { DecoderFallback } from "./DecoderFallback";
import { NormalizationForm } from "./NormalizationForm";
import { Decoder } from "./Decoder";
import { Encoder } from "./Encoder";
import { Stream } from "../IO/Stream";
import { Type } from "../Type";
export class Encoding {
    public GetPreamble(): number[] {
        return {} as any;
    }
    public Clone(): any {
        return {} as any;
    }
    public GetByteCount(chars_or_s?: string[] | string, index?: number, count?: number): number {
        return {} as any;
    }
    public GetBytes(chars_or_s?: string[] | string, index_or_charIndex?: number, count_or_charCount?: number, bytes?: number[], byteIndex?: number): number[] | number {
        return {} as any;
    }
    public GetCharCount(bytes?: number[], index?: number, count?: number): number {
        return {} as any;
    }
    public GetChars(bytes?: number[], index_or_byteIndex?: number, count_or_byteCount?: number, chars?: string[], charIndex?: number): string[] | number {
        return {} as any;
    }
    public IsAlwaysNormalized(form?: NormalizationForm): boolean {
        return {} as any;
    }
    public GetDecoder(): Decoder {
        return {} as any;
    }
    public GetEncoder(): Encoder {
        return {} as any;
    }
    public GetMaxByteCount(charCount?: number): number {
        return {} as any;
    }
    public GetMaxCharCount(byteCount?: number): number {
        return {} as any;
    }
    public GetString(bytes?: number[], index?: number, count?: number): string {
        return {} as any;
    }
    public Equals(value?: any): boolean {
        return {} as any;
    }
    public GetHashCode(): number {
        return {} as any;
    }
    public GetType(): Type {
        return {} as any;
    }
    public ToString(): string {
        return {} as any;
    }
    public static Convert(srcEncoding?: Encoding, dstEncoding?: Encoding, bytes?: number[], index?: number, count?: number): number[] {
        return {} as any;
    }
    public static RegisterProvider(provider?: EncodingProvider): void {
        return {} as any;
    }
    public static GetEncoding(codepage_or_name?: number | string, encoderFallback?: EncoderFallback, decoderFallback?: DecoderFallback): Encoding {
        return {} as any;
    }
    public static GetEncodings(): EncodingInfo[] {
        return {} as any;
    }
    public static CreateTranscodingStream(innerStream?: Stream, innerStreamEncoding?: Encoding, outerStreamEncoding?: Encoding, leaveOpen?: boolean): Stream {
        return {} as any;
    }
    public static get Default(): Encoding {
        return {} as any;
    }
    public get BodyName(): string {
        return {} as any;
    }
    public get EncodingName(): string {
        return {} as any;
    }
    public get HeaderName(): string {
        return {} as any;
    }
    public get WebName(): string {
        return {} as any;
    }
    public get WindowsCodePage(): number {
        return {} as any;
    }
    public get IsBrowserDisplay(): boolean {
        return {} as any;
    }
    public get IsBrowserSave(): boolean {
        return {} as any;
    }
    public get IsMailNewsDisplay(): boolean {
        return {} as any;
    }
    public get IsMailNewsSave(): boolean {
        return {} as any;
    }
    public get IsSingleByte(): boolean {
        return {} as any;
    }
    public get EncoderFallback(): EncoderFallback {
        return {} as any;
    }
    public set EncoderFallback(value: EncoderFallback) {
    }
    public get DecoderFallback(): DecoderFallback {
        return {} as any;
    }
    public set DecoderFallback(value: DecoderFallback) {
    }
    public get IsReadOnly(): boolean {
        return {} as any;
    }
    public static get ASCII(): Encoding {
        return {} as any;
    }
    public static get Latin1(): Encoding {
        return {} as any;
    }
    public get CodePage(): number {
        return {} as any;
    }
    public static get Unicode(): Encoding {
        return {} as any;
    }
    public static get BigEndianUnicode(): Encoding {
        return {} as any;
    }
    public static get UTF7(): Encoding {
        return {} as any;
    }
    public static get UTF8(): Encoding {
        return {} as any;
    }
    public static get UTF32(): Encoding {
        return {} as any;
    }
}