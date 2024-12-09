import { RawJson } from "../IRawJson"

export interface OpenFileInput {
    Inputs: string[],
}

export interface OpenFileOutput {
    [key: string]: 'true'|'false'//key:Input,FilePath
}