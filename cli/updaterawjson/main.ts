import { args, exec, execAsync, cmd, cmdAsync, start, startCmd, copyDirectory, setLoggerPath } from "../.tsc/context";
import { Environment } from "../.tsc/System/Environment";
import { Directory } from "../.tsc/System/IO/Directory";
import { Path } from "../.tsc/System/IO/Path";
import { File } from "../.tsc/System/IO/File";
import { UTF8Encoding } from "../.tsc/System/Text/UTF8Encoding";
import { Server } from "../.tsc/Cangjie/TypeSharp/System/Server";
import { Json } from "../.tsc/TidyHPC/LiteJson/Json";
import { RawJson, WebMessage } from "../IRawJson";
import { apis } from "../.tsc/Cangjie/TypeSharp/System/apis";
import { GetCadVersionInput, GetCadVersionOutput } from "../writeRawJson/GetCadVersion";
import { ExportAllInput, IProgresser, UpdateRawJsonInput } from "./Interfaces";
import { Guid } from "../.tsc/System/Guid";
import { DateTime } from "../.tsc/System/DateTime";
import { fileUtils } from "../.tsc/Cangjie/TypeSharp/System/fileUtils";

let parameters = {} as { [key: string]: string };
let utf8 = new UTF8Encoding(false);
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

let Progresser = (progressPath: string, start: number, length: number, scope: string) => {
    return {} as IProgresser;
};
Progresser = (progressPath: string, start: number, length: number, scope: string) => {
    let current = start;
    let recordByPercent = (percent: number, message: string) => {
        current = start + length * percent;
        let id = Guid.NewGuid().ToString();
        fileUtils.writeLineWithShare(progressPath, `${id} ${JSON.stringify({ DateTime: DateTime.Now.ToString("O"), Scope: scope, Progress: current, Message: message }, null, 0)}`);
    };
    let recordByIncrease = (increase: number, message: string) => {
        current += increase * length;
        let id = Guid.NewGuid().ToString();
        fileUtils.writeLineWithShare(progressPath, `${id} ${JSON.stringify({ DateTime: DateTime.Now.ToString("O"), Scope: scope, Progress: current, Message: message }, null, 0)}`);
    };
    let getSubProgresserByPercent = (subScope: string, percent: number) => {
        return Progresser(progressPath, current, length * percent, subScope);
    };
    return {
        recordByPercent,
        recordByIncrease,
        getSubProgresserByPercent
    };
};

let inputPath = parameters.i ?? parameters.input;
let outputPath = parameters.o ?? parameters.output;
let loggerPath = parameters.l ?? parameters.logger;
let progressPath = parameters.p ?? parameters.progress;
let progresser = Progresser(progressPath, 0, 1, "CheckIn");
if (loggerPath != undefined && loggerPath.length != 0) {
    setLoggerPath(loggerPath);
}

let getCadVersion = async (input: GetCadVersionInput) => {
    let pluginName = "GetCadVersion";
    let response = await apis.runAsync("localrun", {
        PluginName: pluginName,
        Input: input
    });
    if (response.StatusCode == 200) {
        let msg = response.Body as WebMessage;
        if (msg.success) {
            return msg.data.Output as GetCadVersionOutput;
        }
        else {
            throw msg.message;
        }
    }
    else {
        throw `Failed to get cad version, status code: ${response.StatusCode}`;
    }
};

let _formatAgentName = (agentName: string) => {
    if (agentName == "") throw "Agent name is empty";
    let lowerAgentName = agentName.toLowerCase();
    if (lowerAgentName == "solidworks" || lowerAgentName == "sw") return "SW";
    else if (lowerAgentName == "中望cad") return "ZWCAD";
    else if (lowerAgentName == "autocad") return "ZWCAD";
    else return agentName;
};

let formatAgentName = (agentName: string) => {
    let result = _formatAgentName(agentName);
    console.log(`Formatting agent name: ${agentName} -> ${result}`);
    return result;
};

let main = async () => {
    progresser.recordByPercent(0.1, "开始");
    let input = await Json.LoadAsync(inputPath) as UpdateRawJsonInput;
    let filePaths = [] as string[];
    input.WriteRawJson.Documents.forEach(x => {
        if (!filePaths.includes(x.FilePath)) {
            filePaths.push(x.FilePath);
        }
    });
    input.ExportAllInputs.forEach(x => {
        if (!filePaths.includes(x.FilePath)) {
            filePaths.push(x.FilePath);
        }
    });
    progresser.recordByPercent(0.3, "获取文件CAD版本");
    let cadVersions = await getCadVersion({ Inputs: filePaths });
    let mapAgentNameToWriteRawJson = {} as { [key: string]: RawJson };
    let mapAgentNameToExportAll = {} as { [key: string]: ExportAllInput[] };
    for (let doc of input.WriteRawJson.Documents) {
        let cadVersion = cadVersions.CadInfomations.find(x => x.FilePath.replace("\\", "/").toLowerCase() == doc.FilePath.replace("\\", "/").toLowerCase());
        if (cadVersion == undefined) {
            throw `Cannot find cad version for ${doc.FilePath}`;
        }
        let agentName = cadVersion.RecommendedCad.Name;

        if (mapAgentNameToWriteRawJson[agentName] == undefined) {
            mapAgentNameToWriteRawJson[agentName] = {
                DocInfo: {
                    SchemaVersion: "3.2.0"
                },
                Documents: []
            };
        }
        mapAgentNameToWriteRawJson[agentName].Documents.push(doc);
    }
    for (let exportAllItem of input.ExportAllInputs) {
        let cadVersion = cadVersions.CadInfomations.find(x => x.FilePath.replace("\\", "/").toLowerCase() == exportAllItem.FilePath.replace("\\", "/").toLowerCase());
        if (cadVersion == undefined) {
            throw `Cannot find cad version for ${exportAllItem.FilePath}`;
        }
        let agentName = cadVersion.RecommendedCad.Name;
        if (mapAgentNameToExportAll[agentName] == undefined) {
            mapAgentNameToExportAll[agentName] = [];
        }
        mapAgentNameToExportAll[agentName].push(exportAllItem);
    }
    let agentNames = Object.keys(mapAgentNameToWriteRawJson);
    for (let exportAllAgentName of Object.keys(mapAgentNameToExportAll)) {
        if (!agentNames.includes(exportAllAgentName)) {
            agentNames.push(exportAllAgentName);
        }
    }
    progresser.recordByPercent(0.4, "更新信息");
    let subProgresser = progresser.getSubProgresserByPercent("更新信息", 0.4);
    let subDelta = 0.4 / agentNames.length;
    let mapAgentNameToDocuments = {} as { [key: string]: RawJson };
    for (let agentName of agentNames) {
        let pluginName = formatAgentName(agentName) + "UpdateRawJson";
        let response = await apis.runAsync("localrun", {
            PluginName: pluginName,
            Input: {
                WriteRawJson: mapAgentNameToWriteRawJson[agentName] ?? {
                    Documents: []
                },
                ExportAllInputs: mapAgentNameToExportAll[agentName] ?? []
            }
        });
        subProgresser.recordByIncrease(subDelta, `${agentName}更新信息`);
        if (response.StatusCode == 200) {
            let msg = response.Body as WebMessage;
            if (msg.success) {
                mapAgentNameToDocuments[agentName] = msg.data.Output as RawJson;
                console.log(`Successfully write raw json for ${agentName}`);
            }
            else {
                console.log(response.Body);
                throw msg.message;
            }
        }
        else {
            throw `Failed to write raw json, status code: ${response.StatusCode}`;
        }
    }
    progresser.recordByPercent(0.9, "更新完成");
    let output = {} as RawJson;
    output.Documents = [];
    for (let agentName of agentNames) {
        let doc = mapAgentNameToDocuments[agentName];
        for (let itemDoc of doc.Documents) {
            output.Documents.push(itemDoc);
        }
    }
    progresser.recordByPercent(1, "结束");
    await File.WriteAllTextAsync(outputPath, JSON.stringify(output), utf8);
};

await main();


