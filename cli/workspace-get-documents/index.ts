import { UTF8Encoding } from "../.tsc/System/Text/UTF8Encoding";
import { args, setLoggerPath } from "../.tsc/context";
import { apis } from "../.tsc/Cangjie/TypeSharp/System/apis";
import { WebMessage } from "../IRawJson";
import { Json } from "../.tsc/TidyHPC/LiteJson/Json";
import { DocumentInterface, IDocumentRecord, IWorkspaceGetDocumentsInput } from "./interfaces";
import { axios } from "../.tsc/Cangjie/TypeSharp/System/axios";

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
