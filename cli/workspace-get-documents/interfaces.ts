import { DateTime } from "../.tsc/System/DateTime";
import { Guid } from "../.tsc/System/Guid";


export interface IWorkspaceGetDocumentsInput {
    path: string,
    remoteWorkspaceId: string
}

export interface IDocumentRecord {
    name: string;
    number: string;
    partNumber: string;
    state: 'new' | 'checkedIn' | 'checkedOut';
    lifeCycle: string;
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