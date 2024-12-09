import { RawJson } from "../IRawJson"

export interface ActiveDocumentInput {
    Agent: {
        Name: "ZWCAD" | "AutoCAD" | "NX" | "Creo" | "Solidworks" | "Catia" | "GStarCAD" | "TGCAD" | "Inventor" | "Mentor" | "Cadence" | "Altium";
        MajorVersion?: string;
        MinorVersion?: string;
    },
    Option: string
}

export interface ActiveDocumentOutput {
    
}