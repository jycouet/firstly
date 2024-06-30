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

export const toTitleCase = (str: string) => {
  // Replace dashes and underscores with spaces
  const stringWithSpaces = str.replace(/[-_]/g, ' ')

  // Add a space before each capital letter (for camelCase)
  const titleCaseString = stringWithSpaces.replace(/([a-z])([A-Z])/g, '$1 $2')

  // Capitalize the first letter of each word and join them back
  const words = titleCaseString.split(' ')
  const titleCaseWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  )

  return titleCaseWords.join(' ')
}

const rmvChars = (str: string, chars = ['<', '>', ',']) => {
  return chars.reduce((acc, char) => acc.replaceAll(char, ''), str).trim()
}

export const extractMailInfo = (mail: string, withThrow = true) => {
  if (!mail) {
    if (withThrow) {
      throw new Error('No mail provided')
    }
    return {
      firstName: '',
      lastName: '',
      email: '',
    }
  }
  const regex = /(.+)\s(.+)\s<(.+)>/i
  const match = mail.match(regex)
  if (match) {
    const firstName = toTitleCase(rmvChars(match[1].trim())).replaceAll(' ', '-')
    const lastName = rmvChars(match[2].trim()).toUpperCase()
    const email = rmvChars(match[3]).toLowerCase()
    return { firstName, lastName, email }
  }

  if (mail.includes('@')) {
    const clean = rmvChars(mail)
    const [left] = clean.split('@')
    const names = left.split('.')

    return {
      firstName: names.length > 1 ? toTitleCase(names[0]).replaceAll(' ', '-') : '',
      lastName: (names.length > 1 ? names[1] : names[0]).toUpperCase(),
      email: rmvChars(mail).toLowerCase(),
    }
  }

  const clean = rmvChars(mail)

  return {
    firstName: '',
    lastName: clean,
    email: '',
  }
}
