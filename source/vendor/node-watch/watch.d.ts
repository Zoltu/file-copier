declare namespace watch {
	type WatcherEvent = 'change'|'error'|'ready'
	export interface Options {
		persistent?: boolean
		recursive?: boolean
		encoding?: string
		filter?: (path: string) => boolean
	}

	export interface Watcher {
		on: {
			(type: 'change', callback: (event: WatcherEvent, fileName: string) => void): void
			(type: 'error', callback: (error: Error) => void): void
			(type: 'ready', callback: () => void): void
		}
		close: () => void
		isClosed: () => boolean
	}

}

declare function watch(directoryPath: string, options: watch.Options, callback: (event: 'update'|'remove', fileName: string) => void): watch.Watcher

export = watch
