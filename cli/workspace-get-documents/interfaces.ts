import { DateTime } from "../.tsc/System/DateTime";
import { Guid } from "../.tsc/System/Guid";
import { RawJsonDocument } from "../IRawJson";


export interface IWorkspaceGetDocumentsInput {
    path: string,
    remoteWorkspaceId: string
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
}
export interface DocumentWithRawJsonInterface extends DocumentInterface {
    rawJsonDocument: RawJsonDocument
}

export interface ScanResult {
    untrackedFiles: string[],
    documents: DocumentWithRawJsonInterface[],
    modifiedDocuments: DocumentWithRawJsonInterface[],
    missingDocuments: DocumentWithRawJsonInterface[],
}

export interface QueryDocumentsByIndexInput {
    FileNames: string[],
    DocumentNumbers: string[],
    PartNumbers: string[]
}
