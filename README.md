# File Copier
Watches a directory and ensures all files matching a predicate function are mirrored to another directory (recursively), and deletes the files from the mirror when they are deleted from the source.

## Usage
```typescript
import { FileCopier } from '@zoltu/file-copier'
import * as Path from 'path'
const inputDirectoryPath = Path.join(__dirname, '..', 'source')
const outputDirectoryPath = Path.join(__dirname, ',,', 'output')
const filterFunction = (Path: string) => !Path.endsWith('.md')

new FileCopier(inputDirectoryPath, outputDirectoryPath, filterFunction)
```
