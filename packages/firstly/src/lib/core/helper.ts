import type { ErrorInfo } from 'remult'

export function isError<T>(object: any): object is ErrorInfo<T> {
	return object
}
