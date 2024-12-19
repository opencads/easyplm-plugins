import { UTF8Encoding } from "../.tsc/System/Text/UTF8Encoding";
import { args, setLoggerPath } from "../.tsc/context";
import { apis } from "../.tsc/Cangjie/TypeSharp/System/apis";
import { RawJsonDocument, WebMessage } from "../IRawJson";
import { Json } from "../.tsc/TidyHPC/LiteJson/Json";
import { DocumentInterface, IDocumentRecord, IWorkspaceGetDocumentsInput, ScanResult } from "./interfaces";
import { axios } from "../.tsc/Cangjie/TypeSharp/System/axios";
import { Path } from "../.tsc/System/IO/Path";
import { fileUtils } from "../.tsc/Cangjie/TypeSharp/System/fileUtils";
import { taskUtils } from "../.tsc/Cangjie/TypeSharp/System/taskUtils";
let utf8 = new UTF8Encoding(false);
let parameters = {} as { [key: string]: string };
for (let i = 0; i < args.length; i++) {
    let arg = args[i];
    if (arg.startsWith("--")) {
        let key = arg.substring(2);
        let value = args[i + 1];
        parameters[key] = value;
        i++;
    }
    else if (arg.startsWith("-")) {
        let key = arg.substring(1);
        let value = args[i + 1];
        parameters[key] = value;
        i++;
    }
}
console.log(parameters);

let callPlugin = async (pluginName: string, input: any) => {
    let response = await apis.runAsync("run", {
        PluginName: pluginName,
        Input: input
    });
    if (response.StatusCode == 200) {
        let msg = response.Body as WebMessage;
        if (msg.success) {
            return msg.data.Output;
        }
        else {
            throw msg.message;
        }
    }
    else {
        throw `Failed, status code: ${response.StatusCode}`;
    }
};

let getDocumentsByDirectory = async (directory: string) => {
    let response = await apis.runAsync("getDocumentsByDirectory", {
        directory
    });
    if (response.StatusCode == 200) {
        let msg = response.Body as WebMessage;
        if (msg.success) {
            return msg.data as DocumentInterface[];
        }
        else {
            console.log(msg);
            throw msg.message;
        }
    }
    else {
        throw `Failed, status code: ${response.StatusCode}`;
    }
};

let scanDirectory = async (directory: string) => {
    let response = await apis.runAsync("scanDirectory", {
        directory
    });
    if (response.StatusCode == 200) {
        let msg = response.Body as WebMessage;
        if (msg.success) {
            return msg.data as ScanResult;
        }
        else {
            console.log(msg);
            throw msg.message;
        }
    }
    else {
        throw `Failed, status code: ${response.StatusCode}`;
    }
};

let getContent = async (contentMD5: string) => {
    let response = await apis.runAsync("getContent", {
        contentMD5
    });
    if (response.StatusCode == 200) {
        return response.Body as RawJsonDocument;
    }
    else {
        throw `Failed, status code: ${response.StatusCode}`;
    }
};

let getRemoteDocuments = async () => {
    let output = await callPlugin("get-remote-documents", {

    });
    return output.Documents as IDocumentRecord[];
};

let main = async () => {
    let inputPath = parameters.i ?? parameters.input;
    let outputPath = parameters.o ?? parameters.output;
    let loggerPath = parameters.l ?? parameters.logger;
    let progresserPath = parameters.p ?? parameters.progress ?? parameters.progresser;
    if (inputPath == undefined || inputPath == null) {
        throw "inputPath is required";
    }
    if (outputPath == undefined || outputPath == null) {
        throw "outputPath is required";
    }
    if (loggerPath == undefined || loggerPath == null) {
        throw "loggerPath is required";
    }
    let input = Json.Load(inputPath) as IWorkspaceGetDocumentsInput;
    let output = {} as any;
    setLoggerPath(loggerPath);
    let localDocuments = [] as IDocumentRecord[];
    let remoteDocuments = [] as IDocumentRecord[];
    let tasks1 = (async () => {
        let scanResult = await scanDirectory(input.path);
        for (let untrackedFile of scanResult.untrackedFiles) {
            let document = {
                name: Path.GetFileName(untrackedFile),
                fileName: Path.GetFileName(untrackedFile),
                number: "",
                partNumber: "",
                remoteState: 'unknown',
                remoteLastModifiedTime: "",
                lifeCycle: "",
                local: {
                    workspaceState: "untracked",
                    localFilePath: untrackedFile,
                    localAttributes: [],
                    localChildren: [],
                    localLastModifiedTime: fileUtils.lastWriteTime(untrackedFile).ToString("O")
                },
                remoteAttributes: [],
                remoteChildren: []
            } as IDocumentRecord;
            localDocuments.push(document);
        }
        for (let scanDocument of scanResult.documents) {
            let rawJsonDocument = scanDocument.rawJson;
            let attributes = rawJsonDocument.Attributes ?? {};
            let attributeKeys = Object.keys(attributes);
            let children = rawJsonDocument.Children ?? [];
            localDocuments.push({
                name: scanDocument.displayName,
                fileName: scanDocument.originFileName,
                number: scanDocument.documentNumber0,
                partNumber: scanDocument.partNumber0,
                remoteState: 'unknown',
                remoteLastModifiedTime: '',
                lifeCycle: '',
                remoteAttributes: [],
                remoteChildren: [],
                local: {
                    workspaceState: 'archived',
                    localFilePath: Path.Combine(input.path, scanDocument.originFileName),
                    localAttributes: attributeKeys.map(item => {
                        return {
                            key: item,
                            value: attributes[item],
                            type: 'string'
                        }
                    }),
                    localChildren: children.map(item => {
                        return {
                            fileName: item.FileName,
                            name: item.Name ?? item.FileName,
                            number: '',
                            partNumber: ''
                        }
                    }),
                    localLastModifiedTime: fileUtils.lastWriteTime(Path.Combine(input.path, scanDocument.originFileName)).ToString("O")
                }
            });
        }
        for (let scanDocument of scanResult.missingDocuments) {
            let rawJsonDocument = scanDocument.rawJson;
            let attributes = rawJsonDocument.Attributes ?? {};
            let attributeKeys = Object.keys(attributes);
            let children = rawJsonDocument.Children ?? [];
            localDocuments.push({
                name: scanDocument.displayName,
                fileName: scanDocument.originFileName,
                number: scanDocument.documentNumber0,
                partNumber: scanDocument.partNumber0,
                remoteState: 'unknown',
                remoteLastModifiedTime: '',
                lifeCycle: '',
                remoteAttributes: [],
                remoteChildren: [],
                local: {
                    workspaceState: 'missing',
                    localFilePath: Path.Combine(input.path, scanDocument.originFileName),
                    localAttributes: attributeKeys.map(item => {
                        return {
                            key: item,
                            value: attributes[item],
                            type: 'string'
                        }
                    }),
                    localChildren: children.map(item => {
                        return {
                            fileName: item.FileName,
                            name: item.Name ?? item.FileName,
                            number: '',
                            partNumber: ''
                        }
                    }),
                    localLastModifiedTime: fileUtils.lastWriteTime(Path.Combine(input.path, scanDocument.originFileName)).ToString("O")
                }
            });
        }
        for (let scanDocument of scanResult.modifiedDocuments) {
            let rawJsonDocument = scanDocument.rawJson;
            let attributes = rawJsonDocument.Attributes ?? {};
            let attributeKeys = Object.keys(attributes);
            let children = rawJsonDocument.Children ?? [];
            localDocuments.push({
                name: scanDocument.displayName,
                fileName: scanDocument.originFileName,
                number: scanDocument.documentNumber0,
                partNumber: scanDocument.partNumber0,
                remoteState: 'unknown',
                remoteLastModifiedTime: '',
                lifeCycle: '',
                remoteAttributes: [],
                remoteChildren: [],
                local: {
                    workspaceState: 'modified',
                    localFilePath: Path.Combine(input.path, scanDocument.originFileName),
                    localAttributes: attributeKeys.map(item => {
                        return {
                            key: item,
                            value: attributes[item],
                            type: 'string'
                        }
                    }),
                    localChildren: children.map(item => {
                        return {
                            fileName: item.FileName,
                            name: item.Name ?? item.FileName,
                            number: '',
                            partNumber: ''
                        }
                    }),
                    localLastModifiedTime: fileUtils.lastWriteTime(Path.Combine(input.path, scanDocument.originFileName)).ToString("O")
                }
            });
        }
    })();
    let tasks2 = (async () => {
        try {
            remoteDocuments = await getRemoteDocuments();
        }
        catch {

        }
    })();
    await taskUtils.whenAll([tasks1, tasks2]);
    let resultDocuments = [] as IDocumentRecord[];
    output.Documents = resultDocuments;
    for (let document of localDocuments) {
        let remoteDocument = remoteDocuments.find(item => item.fileName == document.fileName);
        if (remoteDocument) {
            document.remoteState = remoteDocument.remoteState;
            document.remoteLastModifiedTime = remoteDocument.remoteLastModifiedTime;
            document.lifeCycle = remoteDocument.lifeCycle;
            document.remoteAttributes = remoteDocument.remoteAttributes;
            document.remoteChildren = remoteDocument.remoteChildren;
            if (document.number == '') {
                document.number = remoteDocument.number;
            }
            if (document.partNumber == '') {
                document.partNumber = remoteDocument.partNumber;
            }
            remoteDocuments.splice(remoteDocuments.indexOf(remoteDocument), 1);
        }
        resultDocuments.push(document);
    }
    output.Documents = localDocuments;
    remoteDocuments.forEach(item => {
        resultDocuments.push(item);
    });
    (output as Json).Save(outputPath);
};

await main();
