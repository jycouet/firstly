<script lang="ts">
	import FF_Config from '../../FF_Config.svelte'
	import FF_Cell from '../FF_Cell.svelte'
</script>

<FF_Config cell={{ config: { label: { width: 33, order: 1, align: 'MiddleLeft' } } }}>
	<!-- Pass an error so hasError=true and label width is NOT forced to 100 -->
	<FF_Cell label={{ html: 'X' }} error={{ html: 'err' }} />
</FF_Config>
