<script lang="ts">
	import { onMount } from 'svelte'

	import { repo } from 'remult'
	import { downloadFile, fileToBase64 } from 'firstly/carbone'
	import { CarboneController } from 'firstly/carbone/CarboneController'
	import { CarboneTemplate } from 'firstly/carbone/carboneEntities'
	import { Button } from 'firstly/internals'

	let fileInput: HTMLInputElement
	let uploading = $state(false)
	let uploadResult = $state('')
	let rendering = $state(false)
	let renderResult = $state('')
	let templateData = $state(
		'{\n  "name": "John Doe",\n  "date": "' + new Date().toLocaleDateString() + '"\n}',
	)

	const handleFileUpload = async (event: Event) => {
		const target = event.target as HTMLInputElement
		const file = target.files?.[0]

		if (!file) return

		try {
			uploading = true
			uploadResult = ''

			// Convert file to base64
			const base64 = await fileToBase64(file)

			// Upload the template
			await CarboneController.uploadTemplate({
				name: file.name.split('.').slice(0, -1).join('.'),
				base64: base64,
			})

			uploadResult = `Successfully uploaded: ${file.name}`
			console.info('Template uploaded successfully:', file.name)

			// Clear the input
			if (fileInput) {
				fileInput.value = ''
			}
		} catch (error) {
			console.error('Upload failed:', error)
			uploadResult = `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
		} finally {
			uploading = false
		}
	}

	let templates: CarboneTemplate[] = $state([])
	onMount(async () => {
		await repo(CarboneTemplate)
			.find({
				orderBy: {
					updatedAt: 'desc',
				},
			})
			.then((t) => {
				templates = t
			})
	})
</script>

<div class="space-y-4">
	<!-- Upload Template Section -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">Upload Template</h2>

			<div class="form-control">
				<label for="fileInput" class="label">
					<span class="label-text">Select template file</span>
				</label>
				<input
					bind:this={fileInput}
					type="file"
					class="file-input file-input-bordered w-full"
					accept=".docx,.xlsx,.pptx,.odt,.ods,.odp"
					onchange={handleFileUpload}
					disabled={uploading}
				/>
				<label for="fileInput" class="label">
					<span class="label-text-alt">Supported: .docx, .xlsx, .pptx, .odt, .ods, .odp</span>
				</label>
			</div>

			{#if uploading}
				<div class="alert alert-info">
					<span class="loading loading-spinner loading-sm"></span>
					Uploading template...
				</div>
			{/if}

			{#if uploadResult}
				<div
					class="alert"
					class:alert-success={uploadResult.includes('Successfully')}
					class:alert-error={uploadResult.includes('failed')}
				>
					{uploadResult}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Available Templates -->
<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title">Available Templates</h2>

		{#if templates.length === 0}
			<div class="alert alert-info">
				<span>No templates uploaded yet. Upload a template above to get started.</span>
			</div>
		{:else}
			<!-- Data Input Section -->
			<div class="mb-6">
				<label for="templateData" class="label">
					<span class="label-text font-semibold">Template Data (JSON)</span>
				</label>
				<textarea
					bind:value={templateData}
					class="textarea textarea-bordered h-32 w-full"
					placeholder={`{
  "name": "John Doe",
  "date": "2024-01-01"
}`}
				></textarea>
				<label for="templateData" class="label">
					<span class="label-text-alt"
						>Enter JSON data that will be passed to the template when rendering</span
					>
				</label>
			</div>

			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each templates as template}
					<div class="card bg-base-200 shadow-md transition-shadow hover:shadow-lg">
						<div class="card-body p-4">
							<h3 class="card-title text-base">{template.name}</h3>

							<div class="space-y-2">
								<div class="badge badge-outline badge-sm">
									{template.extension}
								</div>

								{#if template.updatedAt}
									<div class="text-xs text-base-content/70">
										Updated: {new Date(template.updatedAt).toLocaleDateString()}
									</div>
								{/if}
							</div>

							<div class="card-actions mt-4 justify-between">
								<Button
									class="btn-ghost btn-sm"
									onclick={async () => {
										try {
											// Download the original template
											const templateBuffer = await CarboneController.downloadTemplate({
												templateId: template.id,
											})
											downloadFile(templateBuffer.data, template.name, templateBuffer.contentType)
										} catch (error) {
											console.error('Download failed:', error)
											renderResult = `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
										}
									}}
								>
									Download
								</Button>

								<Button
									class="btn-error btn-sm"
									onclick={async () => {
										try {
											// Download the original template
											await CarboneController.deleteTemplate({
												templateId: template.id,
											})
											templates = await repo(CarboneTemplate).find()
										} catch (error) {
											console.error('Download failed:', error)
											renderResult = `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
										}
									}}
								>
									Delete
								</Button>

								<Button
									class="btn-primary btn-sm"
									onclick={async () => {
										try {
											rendering = true
											renderResult = ''

											// Parse the template data
											let parsedData
											try {
												parsedData = JSON.parse(templateData)
											} catch (parseError) {
												throw new Error('Invalid JSON data. Please check your template data format.')
											}

											const data = await CarboneController.render({
												templateName: template.name,
												data: parsedData,
												filename: `rendered_${template.name}`,
											})

											console.info(`render result:`, data)

											// Download the file
											downloadFile(data.data, data.filename, data.contentType)

											renderResult = `Successfully rendered: ${data.filename}`
										} catch (error) {
											console.error('Render failed:', error)
											renderResult = `Render failed: ${error instanceof Error ? error.message : 'Unknown error'}`
										} finally {
											rendering = false
										}
									}}
									disabled={rendering}
								>
									{#if rendering}
										<span class="loading loading-spinner loading-xs"></span>
									{:else}
										Render
									{/if}
								</Button>
							</div>
						</div>
					</div>
				{/each}
			</div>

			{#if renderResult}
				<div
					class="alert mt-4"
					class:alert-success={renderResult.includes('Successfully')}
					class:alert-error={renderResult.includes('failed')}
				>
					{renderResult}
				</div>
			{/if}
		{/if}
	</div>
</div>
