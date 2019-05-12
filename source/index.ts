import { promises as filesystem } from 'fs'
import * as path from 'path'
import * as watch from './vendor/node-watch/watch'
import { getFileType, recursiveDirectoryDelete, recursiveDirectoryCopy } from './filesystem-extensions'
export { recursiveDirectoryCopy, recursiveDirectoryDelete }
export { ensureDirectoryExists } from './filesystem-extensions'

export class FileCopier {
	private readonly watcher: watch.Watcher
	public constructor(
		private readonly inputDirectoryPath: string,
		private readonly outputDirectoryPath: string,
		inclusionPredicate: (absolutePath: string) => boolean
	) {
		this.watcher = watch(this.inputDirectoryPath, { recursive: true, filter: inclusionPredicate }, this.onChangeDetected)
		recursiveDirectoryCopy(this.inputDirectoryPath, this.outputDirectoryPath, inclusionPredicate).catch(error => {
			console.error(error)
			process.exit(1)
		})
	}

	public readonly shutdown = () => { if (!this.watcher.isClosed()) this.watcher.close() }

	public readonly convertPathFromInputToOutput = (pathToConvert: string) => {
		const pathRelativeToInputDirectory = path.relative(this.inputDirectoryPath, pathToConvert)
		return path.join(this.outputDirectoryPath, pathRelativeToInputDirectory)
	}

	public readonly onChangeDetected = async (event: 'update'|'remove', filePath: string) => {
		try {
			if (event === 'update') {
				switch (await getFileType(filePath)) {
					case 'file':
						await this.onFileAddedOrUpdated(filePath)
						break
					case 'directory':
						await this.onDirectoryAdded(filePath)
						break
					case 'nonexistent':
						console.log(`Saw ${filePath} change but it no longer exists.`)
						break
					case 'other':
						console.log(`${filePath} is neither a file nor a directory, so it was not copied`)
						break
					default:
						throw new Error('Unexpected file type.')
				}
			} else if (event === 'remove') {
				const outputFilePath = this.convertPathFromInputToOutput(filePath)
				switch (await getFileType(outputFilePath)) {
					case 'file':
						await this.onFileRemoved(outputFilePath)
						break
					case 'directory':
						await this.onDirectoryRemoved(outputFilePath)
						break
					case 'nonexistent':
						console.log(`Saw ${outputFilePath} change but it no longer exists.`)
						break
					case 'other':
						console.log(`${outputFilePath} is neither a file nor a directory, so it was not deleted`)
						break
					default:
						throw new Error('Unexpected file type.')
				}
			} else {
				throw new Error(`Unexpected filesystem change event: ${event}`)
			}
		} catch (error) {
			console.error(error)
			process.exit(1)
		}
	}

	private readonly onFileAddedOrUpdated = async (updatedInputFilePath: string) => {
		await filesystem.copyFile(updatedInputFilePath, this.convertPathFromInputToOutput(updatedInputFilePath))
	}

	private readonly onDirectoryAdded = async (newInputDirectoryPath: string) => {
		await recursiveDirectoryCopy(newInputDirectoryPath, this.convertPathFromInputToOutput(newInputDirectoryPath))
	}

	private readonly onFileRemoved = async (oldOutputFilePath: string) => {
		await filesystem.unlink(oldOutputFilePath)
	}

	private readonly onDirectoryRemoved = async (oldOutputDirectoryPath: string) => {
		await recursiveDirectoryDelete(oldOutputDirectoryPath)
	}
}
