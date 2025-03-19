<script lang="ts" generics="ValueType = unknown, EntityType = unknown">
	import { type FieldMetadata } from 'remult'

	interface Props {
		field: FieldMetadata<ValueType, EntityType>
		value: ValueType
	}

	let { field, value = $bindable() }: Props = $props()
</script>

I'm rendering this... {field.key} {value}