export function displayCurrencyWOSuffix(_entity: any, value: number | undefined): string {
	if (value === undefined) return '-'
	return new Intl.NumberFormat('fr', { currency: 'EUR', style: 'currency' })
		.format(value ?? 0)
		.replace('€', '')
		.trim()
}

export function displayCurrency(_entity: any, value: number | undefined): string {
	if (value === undefined) return '- €'
	return new Intl.NumberFormat('fr', { currency: 'EUR', style: 'currency' }).format(value ?? 0)
}

export function displayCurrencyK(_entity: any, value: number | undefined): string {
	if (value === undefined) return '- €'

	if (Math.abs(value) < 1000) {
		return displayCurrency(_entity, value)
	}
	return new Intl.NumberFormat('fr', {
		currency: 'EUR',
		style: 'currency',
		maximumFractionDigits: 0,
	})
		.format(value / 1000)
		.replace('€', 'k€')
}

export function displayPercent(value: number | undefined): string {
	if (value === undefined) {
		return '- %'
	}
	return formatNumber(value) + ' %'
}

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
