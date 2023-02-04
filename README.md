# File Copier
Recursively copy/delete a folder in NodeJS, with the ability to filter certain files/folders along the way as well as get notified for each file/folder copied.

## Usage
```typescript
import { recursiveDirectoryCopy } from '@zoltu/file-copier'
import * as path from 'path'
const inputDirectoryPath = path.join(__dirname, 'source')
const outputDirectoryPath = path.join(__dirname, 'output')
const optionalFilter = async (filePath: string) => !filePath.endsWith('.md')
const optionalListener = async (sourcePath: string, destinationPath: string) => console.log(`${sourcePath} copied to ${destinationPath}`)

await recursiveDirectoryCopy(inputDirectoryPath, outputDirectoryPath, optionalFilter, optionalListener)
```
