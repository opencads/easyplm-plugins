import { UTF8Encoding } from "../.tsc/System/Text/UTF8Encoding";
import { args, setLoggerPath } from "../.tsc/context";
import { apis } from "../.tsc/Cangjie/TypeSharp/System/apis";
import { WebMessage } from "../IRawJson";
import { Json } from "../.tsc/TidyHPC/LiteJson/Json";
import { DocumentInterface, IDocumentRecord, IWorkspaceGetDocumentsInput } from "./interfaces";
import { axios } from "../.tsc/Cangjie/TypeSharp/System/axios";

let utf8 = new UTF8Encoding(false);

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
            throw msg.message;
        }
    }
    else {
        throw `Failed, status code: ${response.StatusCode}`;
    }
};

let main = async () => {
    let inputPath = args[0];
    let outputPath = args[1];
    let loggerPath = args[2];
    let progresserPath = args[3];

    let input = Json.Load(inputPath) as IWorkspaceGetDocumentsInput;
    let output = {} as any;
    setLoggerPath(loggerPath);
    let localDocuments = await getDocumentsByDirectory(input.path);
    let mixedDocuments = localDocuments.map(item => {
        return {
            name: item.displayName,
            number: item.documentNumber0,
            partNumber: item.partNumber0,
            state: 'new',
            lifeCycle: ''
        } as IDocumentRecord;
    });
    output.Documents = mixedDocuments;
    (output as Json).Save(outputPath);
};


await main();