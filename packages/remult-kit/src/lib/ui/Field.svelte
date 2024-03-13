<script lang="ts" generics="T extends Record<any, any>">
  import { createEventDispatcher } from 'svelte'
  import type { HTMLInputAttributes } from 'svelte/elements'

  import type { FieldMetadata, FindOptions } from 'remult'

  import type { KitBaseItem, KitCell } from '../'
  import { suffixWithS } from '../formats/strings'
  import {
    displayWithDefaultAndSuffix,
    getFieldMetaType,
    getRepoDisplayValue,
    type MetaTypeRelation,
  } from '../helper.js'
  import { tw } from '../utils/tailwind'
  import Clipboardable from './Clipboardable.svelte'
  import Icon from './Icon.svelte'
  import FieldContainer from './internals/FieldContainer.svelte'
  import Input from './internals/Input.svelte'
  import MultiSelectMelt from './internals/select/MultiSelectMelt.svelte'
  import SelectMelt from './internals/select/SelectMelt.svelte'
  import SelectRadio from './internals/select/SelectRadio.svelte'
  import Textarea from './internals/Textarea.svelte'

  export let cell: KitCell<T>
  export let value: HTMLInputAttributes['value'] = undefined

  // values of other fields in same context e.g. in form
  export let cellsValues: any = {}

  export let withDedounce: boolean = false

  export let error = ''

  export let mode: 'edit' | 'view' | 'filtre' = 'edit'

  export let focus: boolean = false

  export let clearable: boolean | undefined = undefined
  export let disabled = false

  const dispatch = createEventDispatcher()

  function dispatchSelected(_data: KitBaseItem | KitBaseItem[] | undefined) {
    value = _data
    dispatch('selected', _data)
  }
  $: metaType = getFieldMetaType(cell.field!)

  const isViewMode = (_mode: 'edit' | 'view' | 'filtre', _field?: FieldMetadata<any, any>) => {
    return _mode === 'view' || _field?.dbReadOnly || _field?.options.allowApiUpdate === false
  }

  const common = (_field?: FieldMetadata<any, any>, isLight = false) => {
    let toRet = {
      id: _field?.key ?? 'SOMETHING_AT_LEAST',
      disabled: _field?.dbReadOnly || _field?.options.allowApiUpdate === false || disabled,
      placeholder: _field?.options?.placeholder ?? undefined,
    }
    if (isLight) {
      return toRet
    }
    return {
      ...toRet,
      step: _field?.options?.step ?? undefined,
      name: _field?.key,
      required: _field?.allowNull === false,
    }
  }

  const toInput = (_metadata?: FieldMetadata<any, any>, _value?: HTMLInputAttributes['value']) => {
    try {
      return _metadata?.valueConverter.toInput(_value, metaType.subKind)
    } catch (error) {
      console.error(`error toInput w field '${_metadata?.key}'`, error)
    }
  }

  const fromInput = (_metadata: FieldMetadata<any, any>, _value: HTMLInputAttributes['value']) => {
    try {
      return _metadata?.valueConverter.fromInput(_value, metaType.subKind)
    } catch (error) {
      console.error(`error fromInput w field '${_metadata.key}'`, error)
    }
  }

  let items: any[] = []

  const getLoadOptions = async (str: string) => {
    if (metaType.kind !== 'relation') {
      return
    }
    // To make TS happy
    const metaTypeObj = { ...metaType } as MetaTypeRelation

    let findToUse: FindOptions<any> = {}
    if (metaTypeObj.repoTarget.metadata.options.searchableFind) {
      // narrowFind at the end because searchableFind should not change the narrowed part!
      findToUse = metaTypeObj.repoTarget.metadata.options.searchableFind(str)
    }

    const foEdit = cell.field?.options.findOptionsForEdit
    const narrowFindEdit =
      typeof foEdit === 'function'
        ? foEdit().where ?? {}
        : typeof foEdit === 'object'
          ? foEdit.where ?? {}
          : {}

    // @ts-ignore
    const foCrud = cell.field?.options.findOptions
    const narrowFindCrud =
      typeof foCrud === 'function'
        ? foCrud().where ?? {}
        : typeof foCrud === 'object'
          ? foCrud.where ?? {}
          : {}

    findToUse = {
      include: { ...(findToUse.include ?? {}) },
      where: { ...findToUse.where, ...narrowFindEdit, ...narrowFindCrud },
    }
    if (cell.field?.options?.narrowFindFunc) {
      findToUse = {
        include: { ...findToUse.include },
        where: {
          ...findToUse.where,
          ...(cell.field.options.narrowFindFunc({ ...cellsValues })?.where ?? {}),
        },
      }
    }

    if (cell.filter?.where) {
      // @ts-ignore
      findToUse.where = { ...findToUse.where, ...cell.filtefindOptionsForEdit }
    } else if (cell.filter && !cell.filter.where) {
      // If this field has a filter but no where - means the other field
      // doesn't have a value yet. In this case - don't show any selection option
      return (items = [])
    }
    const res = await metaTypeObj.repoTarget.find({ ...findToUse, limit: 300 })

    items = res.map((r) =>
      getRepoDisplayValue('Field.svelte Select edit', metaTypeObj.repoTarget, r),
    )
  }

  $: cellsValues && getLoadOptions('')
</script>

<FieldContainer
  forId={cell.field?.key ?? ''}
  label={cell?.header ?? cell.field?.caption ?? cell.field?.key}
  required={!cell.field?.allowNull && mode === 'edit' && metaType.subKind !== 'checkbox'}
  {error}
  classes={{ slot: metaType.subKind === 'textarea' ? 'h-32 items-start' : '' }}
>
  {@const clearableComputed =
    cell.clearable || clearable || (mode === 'filtre' && clearable === undefined)}
  {#if isViewMode(mode, cell.field)}
    <span class="input-bordered flex items-center pl-2 pr-4">
      {#if cell.field?.inputType === 'checkbox'}
        <input
          type="checkbox"
          {...common(cell.field)}
          class="checkbox ml-2"
          disabled
          checked={value}
        />
      {:else if metaType.kind === 'relation'}
        {@const item = getRepoDisplayValue(
          'Field.svelte relation readonly',
          metaType.repoTarget,
          value,
        )}
        <div class={tw('flex items-center gap-4', 'h-12', 'pl-2')}>
          {#if item && item?.icon}
            <Icon {...item.icon} />
          {/if}
          <span>{cell?.header ?? item?.caption ?? '-'}</span>
        </div>
      {:else if metaType.kind === 'enum'}
        {@const v = displayWithDefaultAndSuffix(cell.field, value)}
        <div class="ml-2 flex h-12 items-center gap-4">
          {#if value?.icon}
            <Icon {...value?.icon} />
          {/if}
          <Clipboardable value={v}>{v}</Clipboardable>
        </div>
      {:else}
        {@const v = displayWithDefaultAndSuffix(cell.field, value)}
        <div
          class="ml-2 flex h-12 w-full items-center {metaType.subKind === 'number'
            ? 'justify-end'
            : ''}"
        >
          <Clipboardable value={v}>{v}</Clipboardable>
        </div>
      {/if}
    </span>
  {:else if metaType.kind === 'relation'}
    {#if metaType.field.options.multiSelect}
      <MultiSelectMelt
        {...common(cell.field, true)}
        clearable={clearableComputed}
        {items}
        values={value}
        on:selected={(e) => dispatchSelected(e.detail)}
      />
    {:else}
      <SelectMelt
        {...common(cell.field, true)}
        clearable={clearableComputed}
        {items}
        value={value?.id || value}
        on:selected={(e) => dispatchSelected(e.detail)}
        on:issue={(e) => {
          error = e.detail
        }}
      />
    {/if}
  {:else if metaType.kind === 'enum'}
    {#if metaType.field.options.multiSelect}
      <MultiSelectMelt
        {...common(cell.field, true)}
        clearable={clearableComputed}
        items={metaType.values}
        values={value}
        on:selected={(e) => dispatchSelected(e.detail)}
      />
    {:else if metaType.values.length <= (cell.field?.options.styleRadioUntil ?? 3) && !clearableComputed}
      <SelectRadio
        {...common(cell.field, true)}
        items={metaType.values}
        value={value?.id || value}
        on:selected={(e) => dispatchSelected(e.detail)}
      />
    {:else}
      <SelectMelt
        {...common(cell.field, true)}
        clearable={clearableComputed}
        items={metaType.values}
        value={value?.id || value}
        on:selected={(e) => dispatchSelected(e.detail)}
        on:issue={(e) => {
          error = e.detail
        }}
      />
    {/if}
  {:else if metaType.subKind === 'checkbox'}
    <div class="grid content-center items-center pl-4">
      <input
        type="checkbox"
        {...{ ...common(cell.field), required: undefined }}
        class="checkbox"
        bind:checked={value}
      />
    </div>
  {:else if metaType.subKind === 'text' || metaType.subKind === 'email' || metaType.subKind === 'password' || metaType.subKind === 'dateOnly' || metaType.subKind === 'number'}
    <div class="input input-bordered inline-flex w-full items-center pl-2">
      <!-- autocomplete={metaType.subKind === 'password' ? 'current-password' : 'off'} -->
      <Input
        {focus}
        {...common(cell.field)}
        autoComplete="off"
        class={tw(
          `join-item placeholder:text-base-content/30 w-full bg-transparent`,
          metaType.subKind === 'number' && 'text-end',
        )}
        type={metaType.subKind.replaceAll('dateOnly', 'date')}
        value={toInput(cell.field, value)}
        {withDedounce}
        on:input={(e) => {
          // @ts-ignore
          value = fromInput(cell.field, e.detail.value)
        }}
        {...$$restProps}
      />
      {#if cell.field?.options.suffix}
        {#if cell.field?.options.suffixWithS}
          {suffixWithS(value, cell.field?.options.suffix)}
        {:else}
          {cell.field?.options.suffix}
        {/if}
      {/if}
    </div>
  {:else if metaType.subKind === 'textarea'}
    <Textarea
      {...common(cell.field)}
      value={toInput(cell.field, value)}
      on:input={(e) => {
        // @ts-ignore
        value = fromInput(cell.field, e.detail.value)
      }}
    />
  {:else}
    <!-- This shoud NEVER be displayed -->
    <span class="text-error flex items-center pl-2"
      >Type "{cell.field?.inputType}" not managed!</span
    >
  {/if}
</FieldContainer>
