# CADInteractive

CADInteractive 用于和当前 CAD 进行交互操作。

# 功能列表

- 启用 Toolbar 的按钮可见/可用状态
- 禁用指定的 Toolbar 按钮
- 启动指定的菜单项
- 禁用指定的菜单项。
- 启用指定的 Ribbon 的按钮
- 禁用指定的 Ribbon 的按钮
- 获取每种类型按钮/菜单的状态

# 功能描述

1. EnableToolbar/DisableToolbar

   - 这些指令将允许启用、禁用或修改 CAD 中的工具栏按钮。
   - 为了实现这些功能，插件需要能够访问 CAD 软件的内部 API，以便找到相应的工具栏对象并对其进行操作。
2. EnableMenu/DisableMenu

   - 类似于工具栏的指令，这些指令将用于控制 CAD 中的菜单。
   - 菜单项可能需要更复杂的逻辑，因为它们可能包含子菜单和分隔符等元素。
3. EnableRibbon/DisableRibbon

   - 与工具栏和菜单类似，插件需要能够启用、禁用或修改功能区的各个部分。

## ButtonManager

### 说明

```
   按钮类型包括工具栏按钮、菜单按钮和 Ribbon 按钮。记录每个按钮的状态，如启用和禁用，并根据操作自动切换按钮状态。按钮的详细信息，如名称、类型和状态，可以通过一个字典进行查询。
```

提供了一个结构化的按钮管理系统，定义了按钮的状态、操作以及相关的数据输入输出接口。核心内容包括：

1. **按钮接口** (`CustomButton`): 描述了每个按钮的名称和可用状态，使得能够灵活管理不同按钮的行为。
2. **按钮标签与动作的枚举**: 通过 `ButtonLabels` 和 `Actions` 两个枚举，代码系统化地定义了各种按钮的标识和允许的操作，确保了一致性和可扩展性。
3. **输入输出接口**: `Input` 接口用于接收按钮管理的请求，而 `Output` 接口则用来返回按钮的状态信息。这使得系统能够以明确的方式处理按钮的状态管理。
4. **示例数据**: 提供的示例输入和输出数据展示了如何实际使用这些接口，便于开发者理解整体功能和用法。

### 定义

```typescript
// 定义按钮接口
interface CustomButton {
    Label: string; // 按钮名称
    Enabled: boolean; // 按钮状态
};
// 按钮lable
const ButtonLabels = "登录" | "注销" | "自动检入"| "自定义检入"| "保存到工作区"| "检出"| "取消检出"| "从PDM打开"| "从PDM插入"| "更新"| "打开CoDesign"; 
// 按钮Id
const ButtonIds = "Login" | "Logout" | "AutoCheckIn" | "CustomCheckIn" | "SaveToWorkspace" | "CheckOut" | "CancelCheckOut" | "OpenPDMModel" | "InsertPDMModel" | "Update"| "OpenCoDesign"; 

const Items: IItem[] = [
    { "Id": ButtonIds.Login, "Label": ButtonLabels.登录 },
    { "Id": ButtonIds.Logout, "Label": ButtonLabels.注销 },
    { "Id": ButtonIds.AutoCheckIn, "Label": ButtonLabels.自动检入 },
    { "Id": ButtonIds.CustomCheckIn, "Label": ButtonLabels.自定义检入 },
    { "Id": ButtonIds.SaveToWorkspace, "Label": ButtonLabels.保存到工作区 },
    { "Id": ButtonIds.CheckIn, "Label": ButtonLabels.检入 },
    { "Id": ButtonIds.CheckOut, "Label": ButtonLabels.检出 },
    { "Id": ButtonIds.CancelCheckOut, "Label": ButtonLabels.取消检出 },
    { "Id": ButtonIds.OpenPDMModel, "Label": ButtonLabels.从PDM打开 },
    { "Id": ButtonIds.InsertPDMModel, "Label": ButtonLabels.从PDM插入 },
    { "Id": ButtonIds.Update, "Label": ButtonLabels.更新 },
    { "Id": ButtonIds.OpenCoDesign, "Label": ButtonLabels.打开CoDesign}
];
// 动作常量
enum Actions = {
    Enable= 'Enable' ,    //启用
    Disable= 'Disable',   //禁用
    Get= 'Get',           //获取
};
export interface IItem{
    Id:ButtonIds,
    Label:ButtonLabels 
}
```

### 输入

```typescript
export interface Input {
    Option: "ButtonManager";
    Data: {
         ButtonIds: ButtonIds[] ; // 按钮的唯一标识符
         Action: Actions ; // 动作       
    }
}

// 示例输入数据
const exampleInput: Input = {
    Option: "ButtonManager",
    Data: {      
        ButtonIds: [
                ButtonIds.Login,
                ButtonIds.Logout ,
                ButtonIds.AutoCheckIn,
                ButtonIds.CustomCheckIn,
                ButtonIds.SaveToWorkspace
                ], // 登录、注销、自动检入、自定义检入、保存到工作区
        Action: Actions.Get,
    }
};
```

### 输出

```typescript
// 输出接口
export interface Output {
    Option: "ButtonManager";
    Data: { [key: string]: CustomButton }; //   
};

// 示例输出数据
const exampleOutput: Output = {
    Option: "ButtonManager",
    Data: {
        "CheckIn": { Label: "检入", Enabled: true },       // 检入按钮启用_
        "CheckOut": { Label: "检出", Enabled: false },    // 检出按钮禁用_
        "CancelCheckOut": { Label: "取消检出", Enabled: true }, // 取消检出按钮启用_
        "Login": { Label: "登录", Enabled: true },         // 登录按钮启用_
        "Logout": { Label: "注销", Enabled: true },       // 注销按钮启用_
        "InsertPDMModel": { Label: "插入PDM模型", Enabled: true }, // 插入PDM模型按钮启用
    }
};
```

## GetRawJsonByFilePath

根据文件路径获取目标文档的 RawJson，如果是装配，不获取装配下所有子级文档的 RawJson，只获取装配自身数据。如果获取失败，请抛出异常，并在日志中记录错误信息。

### 输入

```typescript
export interface Input {
    Option:"GetRawJsonByFilePath",
    Data:string[] //如["C:/1.prt"]
}
```

### 输出

```typescript
export interface Output {
    Data:RawJson
}
```