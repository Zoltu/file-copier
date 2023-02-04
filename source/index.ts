import { promises as filesystem } from 'fs'
import * as path from 'path'

export type FileType = 'file' | 'directory' | 'nonexistent' | 'other'

export async function ensureDirectoryExists(absoluteDirectoryPath: string) {
	// !@#$ you nodejs and not providing any way to check for file existence without an exception
	try {
		await filesystem.mkdir(absoluteDirectoryPath, { recursive: true })
	} catch (error) {
		if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'EEXIST') return
		throw error
	}
}

export async function fileExists(absoluteFilePath: string) {
	// !@#$ you nodejs and not providing any way to check for file existence without an exception
	try {
		await filesystem.access(absoluteFilePath)
		return true
	} catch {
		return false
	}
}

export async function getFileType(filePath: string): Promise<FileType> {
	// !@#$ you nodejs and not providing any way to get file information without an exception
	try {
		const fileDetails = await filesystem.lstat(filePath)
		if (fileDetails.isDirectory()) return 'directory'
		else if (fileDetails.isFile()) return 'file'
		else return 'other'
	} catch (error) {
		if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') return 'nonexistent'
		throw error
	}
}

export async function recursiveDirectoryCopy(sourceDirectoryPath: string , destinationDirectoryPath: string, inclusionPredicate: (absolutePath: string, fileType: FileType) => Promise<boolean> = async () => true, copyListener: (sourcePath: string, destinationPath: string) => Promise<void> = async () => {}) {
	if (!path.isAbsolute(sourceDirectoryPath)) throw new Error(`Absolute source path required.  Provided: ${sourceDirectoryPath}`)
	if (!path.isAbsolute(destinationDirectoryPath)) throw new Error(`Absolute destination path required.  Provided: ${destinationDirectoryPath}`)
	sourceDirectoryPath = path.normalize(sourceDirectoryPath)
	destinationDirectoryPath = path.normalize(destinationDirectoryPath)
	await ensureDirectoryExists(destinationDirectoryPath)
	const fileNames = await filesystem.readdir(sourceDirectoryPath)
	for (let fileName of fileNames) {
		const sourceFilePath = path.join(sourceDirectoryPath, fileName)
		const fileType = await getFileType(sourceFilePath)
		if (!(await inclusionPredicate(sourceFilePath, fileType))) continue
		const destinationFilePath = path.join(destinationDirectoryPath, fileName)
		switch (fileType) {
			case 'directory':
				await recursiveDirectoryCopy(sourceFilePath, destinationFilePath, inclusionPredicate, copyListener)
				break
			case 'file':
				await filesystem.copyFile(sourceFilePath, destinationFilePath)
				await copyListener(sourceFilePath, destinationFilePath)
				break
			case 'nonexistent':
				break
			case 'other':
				console.log(`${sourceFilePath} is neither a file nor a directory, so it was not copied`)
				break
			default:
				throw new Error(`Missing case statement in switch block, see getFileType`)
		}
	}
}

export async function recursiveDirectoryDelete(directoryPath: string) {
	if (!path.isAbsolute(directoryPath)) throw new Error(`Absolute directory path required.  Provided: ${directoryPath}`)
	directoryPath = path.normalize(directoryPath)
	try {
		const fileNames = await filesystem.readdir(directoryPath)
		for (let fileName of fileNames) {
			const filePath = path.join(directoryPath, fileName)
			switch (await getFileType(filePath)) {
				case 'directory':
					await recursiveDirectoryDelete(filePath)
					break
				case 'file':
					try {
						await filesystem.unlink(filePath)
					} catch (error) {
						if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') return
						throw error
					}
					break
				case 'nonexistent':
					break
				case 'other':
					throw new Error(`${filePath} is neither a file nor a directory, don't know how to delete it.`)
				default:
				throw new Error(`Missing case statement in switch block, see getFileType`)
			}
		}
		await filesystem.rmdir(directoryPath)
	} catch (error) {
		if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') return
		throw error
	}
}
