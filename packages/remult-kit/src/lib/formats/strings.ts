export const formatNumber = (number: number, digitNumber = 2) => {
	if (number === undefined || number === null || isNaN(number)) {
		const value = 0
		return value.toFixed(digitNumber)
	}
	return number
		.toFixed(digitNumber) // decimal digits
		.replace('.', ',') // replace decimal point character with ,
		.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ')
}

export function displayPhone(_entity: any, value: string | undefined): string {
	return formatPhone(value ?? '')
}

const formatPhone = (phone: string): string => {
	if (!phone) {
		return ''
	}

	return phone

	// TODO: Let's be smart one day... and add a ton of tests!
	// const replaced = phone.replaceAll(' ', '').replaceAll('.', '')

	// let formatted: string = replaced

	// if (replaced.charAt(0) === '+') {
	// 	return formatted
	// } else if (replaced.slice(0, 2) === '00') {
	// 	return `+${formatted.slice(2)}`
	// } else if (replaced.length > 10) {
	// 	formatted = replaced.slice(0, 10)
	// }

	// return `+33${formatted.slice(1)}`
}

export const arrToStr = (arr: string | undefined | (string | undefined)[]) => {
	if (!arr) return ''
	if (typeof arr === 'string') return arr
	return arr.filter((c) => c).join(' - ')
}

export const mask = (str: string | undefined) => {
	if (str === undefined) return ''
	return str.slice(0, -4).replace(/./g, '*') + str.slice(-4)
}

export const suffixWithS = (value: number, str: string) => {
	if (value) {
		if (value <= 1) {
			return `${str}`
		} else {
			if (str.endsWith('²')) {
				return `${str}`
			} else {
				return `${str}s`
			}
		}
	} else {
		return `${str}`
	}
}
