import { getContext, setContext } from 'svelte'
import type { CustomFieldSnippet, CustomFieldType } from './createCustomField'

// Define individual component theme interfaces
export interface FieldTheme {
  root?: string
  label?: string
  error?: string
  select?: string
  checkbox?: string
  input?: string
  container?: string
  header?: string
}

export interface GridTheme {
  root?: string
  header?: string
  headerCell?: string
  row?: string
  rowCell?: string
  actions?: string
  actionButton?: string
  actionsColumn?: string
  actionsHeader?: string
  loadMoreButton?: string
}

export interface FormTheme {
  root?: string
  fields?: string
  actions?: string
  submitButton?: string
  cancelButton?: string
}

// Main theme interface with nested component themes
export interface Theme {
  // Common styles that apply to the app
  root?: string
  
  // Component-specific themes
  field?: FieldTheme
  grid?: GridTheme
  form?: FormTheme
}

// Define the custom field function type
export type CustomFieldFunction = <valueType, entityType>(info: CustomFieldType<valueType, entityType>) => CustomFieldSnippet<valueType, entityType> | undefined

// Config interface that includes both theme and customField
export interface Config {
  theme: Theme
  customField?: CustomFieldFunction
}

// Default themes for each component
export const defaultFieldTheme: FieldTheme = {
  checkbox: 'checkbox',
  input: 'input',
  select: 'select',
  root: '',
  label: '',
  error: '',
}

export const defaultGridTheme: GridTheme = {
  root: 'table',
  actions: 'flex gap-2 justify-end',
  actionButton: 'text-xs',
  actionsColumn: 'text-right',
  actionsHeader: 'text-right',
}

export const defaultFormTheme: FormTheme = {
  root: '',
  fields: '',
  actions: 'flex justify-end gap-2 mt-4',
  submitButton: 'btn btn-primary',
  cancelButton: 'btn',
}

// Default theme combining all component defaults
export const defaultTheme: Theme = {
  field: defaultFieldTheme,
  grid: defaultGridTheme,
  form: defaultFormTheme,
}

// Theme context key
const THEME_KEY = 'firstly:theme'
const CUSTOM_FIELD_KEY = 'firstly:customField'

// Helper to deeply merge objects
function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target }
  
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    Object.keys(source).forEach(key => {
      const sourceValue = source[key as keyof typeof source]
      const targetValue = target[key as keyof typeof target]
      
      if (
        sourceValue && 
        typeof sourceValue === 'object' && 
        !Array.isArray(sourceValue) &&
        targetValue && 
        typeof targetValue === 'object' && 
        !Array.isArray(targetValue)
      ) {
        // If both values are objects, recursively merge them
        result[key as keyof typeof result] = deepMerge(
          targetValue,
          sourceValue as any
        ) as any
      } else if (sourceValue !== undefined) {
        // Otherwise, just assign the source value
        result[key as keyof typeof result] = sourceValue as any
      }
    })
  }
  
  return result
}

// Set theme context
export function setTheme(theme: Theme): Theme {
  return setContext(THEME_KEY, deepMerge(defaultTheme, theme))
}

// Get theme context
export function getTheme(): Theme {
  return getContext(THEME_KEY) || defaultTheme
}

// Set custom field function
export function setCustomFieldFunction(fn?: CustomFieldFunction): void {
  setContext(CUSTOM_FIELD_KEY, fn)
}

// Get custom field function
export function getCustomFieldFunction(): CustomFieldFunction | undefined {
  return getContext(CUSTOM_FIELD_KEY)
}

// Helper functions to get component-specific themes
export function getFieldTheme(): FieldTheme {
  const theme = getTheme()
  return theme.field || defaultFieldTheme
}

export function getGridTheme(): GridTheme {
  const theme = getTheme()
  return theme.grid || defaultGridTheme
}

export function getFormTheme(): FormTheme {
  const theme = getTheme()
  return theme.form || defaultFormTheme
} 