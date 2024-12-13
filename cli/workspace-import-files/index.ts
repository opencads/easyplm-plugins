import { args, setLoggerPath } from '../.tsc/context';
import { Json } from '../.tsc/TidyHPC/LiteJson/Json';
import { DocumentInterface, IImportInput } from './interfaces';
import { apis } from '../.tsc/Cangjie/TypeSharp/System/apis';
import { WebMessage } from '../IRawJson';
import { GetCadVersionOutput } from '../GetCadVersion';
import { ExportAllInput, ExportAllOutput } from '../ExportAll';
import { ImportInterface } from '../ImportInterface';
import { axios } from '../.tsc/Cangjie/TypeSharp/System/axios';
import { Path } from '../.tsc/System/IO/Path';
import { File } from '../.tsc/System/IO/File';
import { UTF8Encoding } from '../.tsc/System/Text/UTF8Encoding';

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

let exportAll = async (input: ExportAllInput) => {
    return await callPlugin("ExportAll", input) as ExportAllOutput;
};

let getDefaultDirectory = async () => {
    let response = await apis.runAsync("getDefaultDirectory", {

    });
    if (response.StatusCode == 200) {
        let msg = response.Body as WebMessage;
        if (msg.success) {
            return msg.data;
        }
        else {
            throw msg.message;
        }
    }
    else {
        throw `Failed, status code: ${response.StatusCode}`;
    }
};

let importDocuments = async (data: ImportInterface[]) => {
    let response = await apis.runAsync("import", {
        data: data
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
    if (args.length < 4) {
        console.log("Usage: <inputPath> <outputPath> <loggerPath> <progresserPath>");
        return;
    }
    let inputPath = args[0];
    let outputPath = args[1];
    let loggerPath = args[2];
    let progresserPath = args[3];

    let input = Json.Load(inputPath) as IImportInput;
    let output = {} as any;
    setLoggerPath(loggerPath);
    // 先将入参的文件都获取RawJson
    let exportAllInput = {
        Inputs: []
    } as ExportAllInput;
    for (let item of input.Items) {
        exportAllInput.Inputs.push({
            FilePath: item.FilePath,
            Properties: {

            }
        });
    }
    let exportAllOutput = await exportAll(exportAllInput);
    // 开始构建导入数据
    let importInput = [] as ImportInterface[];
    let defaultDirectory = await getDefaultDirectory();
    for (let document of exportAllOutput.Documents) {
        let importItem = {} as ImportInterface;
        importItem.filePath = document.FilePath;
        importItem.directory = defaultDirectory;
        importItem.displayName = document.FileName;
        importItem.documentNumber0 = "";
        importItem.documentNumber1 = "";
        importItem.documentNumber2 = "";
        importItem.partNumber0 = "";
        importItem.partNumber1 = "";
        importItem.partNumber2 = "";
        importItem.documentRemoteID = "";
        importItem.partRemoteID = "";
        importItem.rawJson = document;
        importInput.push(importItem);
    }

    let importResult = await importDocuments(importInput);
    File.WriteAllText(outputPath, JSON.stringify({
        importResult
    }), utf8);
};

await main();
