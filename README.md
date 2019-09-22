# File Copier
Watches a directory and ensures all files matching a predicate function are mirrored to another directory (recursively), and deletes the files from the mirror when they are deleted from the source.

## Usage
```typescript
import { FileCopier } from '@zoltu/file-copier'
import * as path from 'path'
const inputDirectoryPath = path.join(__dirname, 'source')
const outputDirectoryPath = path.join(__dirname, 'output')
const filterFunction = (filePath: string) => !filePath.endsWith('.md')

new FileCopier(inputDirectoryPath, outputDirectoryPath, filterFunction)
```
