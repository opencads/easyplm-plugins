# WriteRawJson

# 定义

WriteRawJson 是基于 Cad 能力将目标属性/结构写入到 Cad 文件中。

# 输入

RawJson 3.1

```typescript
export interface Input extendns RawJson {

}
```

# 输出

```typescript
export interface WriteRawJsonOutput {
    [key: string]: 'true' | 'false'//key:Document.FilePath
}
```
