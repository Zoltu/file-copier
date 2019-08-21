import { promises as filesystem } from 'fs'
import * as path from 'path'

export async function ensureDirectoryExists(absoluteDirectoryPath: string) {
	try {
		await filesystem.mkdir(absoluteDirectoryPath, { recursive: true })
	} catch (error) {
		if (error.code === 'EEXIST') return
		throw error
	}
}

export async function fileExists(absoluteFilePath: string) {
	// !@#$ you nodejs and not providing any way to check for file existence without an exception
	try {
		await filesystem.access(absoluteFilePath)
		return true
	} catch (_) {
		return false
	}
}

export async function getFileType(filePath: string): Promise<'file'|'directory'|'nonexistent'|'other'> {
	try {
		const fileDetails = await filesystem.lstat(filePath)
		if (fileDetails.isDirectory()) return 'directory'
		else if (fileDetails.isFile()) return 'file'
		else return 'other'
	} catch (error) {
		if (error.code === 'ENOENT') return 'nonexistent'
		throw error
	}
}

export async function recursiveDirectoryCopy(sourceDirectoryPath: string , destinationDirectoryPath: string, inclusionPredicate: (absolutePath: string) => boolean = () => true, copyListener: (sourcePath: string, destinationPath: string) => Promise<void> = async () => {}) {
	if (!path.isAbsolute(sourceDirectoryPath)) throw new Error(`Absolute source path required.  Provided: ${sourceDirectoryPath}`)
	if (!path.isAbsolute(destinationDirectoryPath)) throw new Error(`Absolute destination path required.  Provided: ${destinationDirectoryPath}`)
	sourceDirectoryPath = path.normalize(sourceDirectoryPath)
	destinationDirectoryPath = path.normalize(destinationDirectoryPath)
	await ensureDirectoryExists(destinationDirectoryPath)
	const fileNames = await filesystem.readdir(sourceDirectoryPath)
	for (let fileName of fileNames) {
		const sourceFilePath = path.join(sourceDirectoryPath, fileName)
		if (!(await inclusionPredicate(sourceFilePath))) continue
		const destinationFilePath = path.join(destinationDirectoryPath, fileName)
		switch (await getFileType(sourceFilePath)) {
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
						if (error.code === 'ENOENT') return
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
		if (error.code === 'ENOENT') return
		throw error
	}
}
