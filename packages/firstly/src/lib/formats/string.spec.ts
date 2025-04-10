import { describe, expect, it } from 'vitest'

import { nameify, slugify } from './strings'

describe('slugify', () => {
	it('should convert a string to lowercase', () => {
		expect(slugify('HELLO WORLD')).toBe('hello-world')
	})

	it('should replace spaces with hyphens', () => {
		expect(slugify('hello world')).toBe('hello-world')
	})

	it('should remove non-word characters except hyphens', () => {
		expect(slugify('hello@world!')).toBe('hello-world')
	})

	it('should replace multiple spaces, underscores, and hyphens with a single hyphen', () => {
		expect(slugify('hello   world___test---example')).toBe('hello-world-test-example')
	})

	it('should remove leading and trailing hyphens', () => {
		expect(slugify('-hello-world-')).toBe('hello-world')
	})

	it('should handle empty strings', () => {
		expect(slugify('')).toBe('')
	})

	it('should return undefined for undefined input', () => {
		expect(slugify(undefined)).toBeUndefined()
	})

	it('should handle strings with only non-word characters', () => {
		expect(slugify('!@#$%^&*()')).toBe('')
	})

	it('should handle strings with mixed case and special characters', () => {
		expect(slugify('Hello World! This is a Test_String 123')).toBe(
			'hello-world-this-is-a-test-string-123',
		)
	})

	it('should handle dots', () => {
		expect(slugify('DP.Mollier')).toBe('dp.mollier')
	})

	it('should handle 🎉', () => {
		expect(slugify('Jo🎉')).toBe('jo')
	})
})

describe('nameify', () => {
	it('should capitalize the first letter', () => {
		expect(nameify('hello')).toBe('Hello')
	})
	it('should . become a space', () => {
		expect(nameify('jy.c')).toBe('Jy C')
	})
	it('should - become a -', () => {
		expect(nameify('j-y.c')).toBe('J-Y C')
	})
	it('should handle multiple spaces', () => {
		expect(nameify('j  y  c')).toBe('J Y C')
	})

	it('should capitalize each word after a space or hyphen', () => {
		expect(nameify('hello world-example')).toBe('Hello World-Example')
	})

	it('should handle mixed case input', () => {
		expect(nameify('jOHn dOE')).toBe('John Doe')
	})

	it('should trim leading and trailing spaces', () => {
		expect(nameify('  alice smith  ')).toBe('Alice Smith')
	})

	it('should handle input with multiple dots', () => {
		expect(nameify('a.b.c')).toBe('A B C')
	})

	it('should return undefined for undefined input', () => {
		expect(nameify(undefined)).toBeUndefined()
	})

	it('should handle empty string', () => {
		expect(nameify('')).toBe('')
	})

	it('should handle string with only special characters', () => {
		expect(nameify('.-_')).toBe('-_')
	})

	it('should handle complex mixed input', () => {
		expect(nameify('jOHn.dOE-SMITH   jr.')).toBe('John Doe-Smith Jr')
	})

	it("should handle maybe do better, ha no it's good", () => {
		expect(nameify('no ho')).toBe('No Ho')
	})

	it('should handle email', () => {
		expect(nameify('no ho@gmail.com')).toBe('No Ho')
	})
})
