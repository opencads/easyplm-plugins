export type Guid = string;
export type DateTime = string;

export interface IImportInput {
    Items: {
        FilePath: string
    }[]
}

export interface DocumentInterface {
    id: Guid,
    key: string,
    originFileName: string,
    formatFileName: string,
    lowerFormatFileName: string,
    contentMD5: string,
    rawJsonMD5: string,
    documentNumber0: string,
    documentNumber1: string,
    documentNumber2: string,
    partNumber0: string,
    partNumber1: string,
    partNumber2: string,
    documentRemoteID: string,
    partRemoteID: string,
    displayName: string,
    createTime: DateTime,
    updateTime: DateTime,
    fileLastWriteTime: DateTime,
    fileLength: number
}

export interface IImportOutput extends DocumentInterface {
    rawJson:any
}