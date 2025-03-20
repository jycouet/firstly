# FField Theming

Firstly provides a flexible way to style form fields globally using the theme provider system. This allows you to apply consistent styles across your application without repeating the same class definitions.

## Basic Usage

There are two ways to style your fields:

1. **Per-component styling** - Pass classes directly to the FField component
2. **Theme-based styling** - Use the FFieldThemeProvider to set styles for all child components

## Using the FFieldThemeProvider

The `FFieldThemeProvider` component allows you to define styles that will be applied to all `FField` components within its scope.

```svelte
<script>
  import { FFieldThemeProvider, FField } from 'firstly'
</script>

<FFieldThemeProvider theme={{
  input: 'input input-bordered input-primary w-full',
  select: 'select select-bordered select-primary w-full', 
  checkbox: 'checkbox checkbox-primary',
  root: 'my-2',
  label: 'text-sm font-medium',
  error: 'text-error text-sm'
}}>
  <!-- All FField components in this scope will use the theme -->
  <div>
    <FField field={nameField} bind:value={name} />
    <FField field={emailField} bind:value={email} />
  </div>
</FFieldThemeProvider>
```

## Nesting Providers

You can nest theme providers to create different styles for different sections of your application:

```svelte
<FFieldThemeProvider theme={{
  input: 'input input-bordered input-primary w-full',
  checkbox: 'checkbox checkbox-primary'
}}>
  <!-- These use the primary theme -->
  <FField field={nameField} bind:value={name} />
  
  <FFieldThemeProvider theme={{
    input: 'input input-bordered input-secondary w-full',
    checkbox: 'checkbox checkbox-secondary'
  }}>
    <!-- These use the secondary theme -->
    <FField field={emailField} bind:value={email} />
  </FFieldThemeProvider>
</FFieldThemeProvider>
```

## Available Theme Properties

The FFieldThemeClasses interface provides the following customization options:

```typescript
interface FFieldThemeClasses {
  root?: string      // Container element
  label?: string     // Field label
  error?: string     // Error message
  input?: string     // Text inputs
  select?: string    // Select dropdowns
  checkbox?: string  // Checkbox inputs
}
```

## Overriding Theme Styles

Individual components can still override theme styles by passing a `classes` prop directly:

```svelte
<FFieldThemeProvider theme={{ input: 'input input-primary' }}>
  <!-- Uses the theme -->
  <FField field={nameField} bind:value={name} />
  
  <!-- Overrides the theme for this field only -->
  <FField 
    field={emailField} 
    bind:value={email} 
    classes={{ input: 'input input-accent' }} 
  />
</FFieldThemeProvider>
```

## Using with FForm

The `FForm` component accepts a `classes.fields` property that can be used to pass theme values to all fields within the form:

```svelte
<FForm
  {r}
  classes={{
    root: 'my-form',
    actions: 'mt-4 flex justify-end',
    button: 'btn btn-primary',
    fields: {
      input: 'input input-bordered w-full',
      select: 'select select-bordered w-full',
      checkbox: 'checkbox checkbox-primary'
    }
  }}
/>
```

## Best Practices

1. Define common themes at the layout level to maintain consistency
2. Use specific overrides only when needed for special cases
3. Use meaningful class names from your CSS framework (like DaisyUI)
4. Consider creating themed components for different form variations 