<script lang="ts">
	import { MailController } from '$modules/mail/MailController'

	import type { PageProps } from './$types'

	const { data }: PageProps = $props()
</script>

<section>
	<h2 class="text-2xl font-bold">HTML</h2>
	<div class="border border-primary">
		{@html data.html}
	</div>
</section>

<section class="mt-4">
	<h2 class="text-2xl font-bold">PLAIN TEXT</h2>
	<div class="border border-primary">
		<p>{data.plainText}</p>
	</div>
</section>

<br />
<br />
<br />

<button
	onclick={() => {
		MailController.sendMail()
	}}
>
	Send test mail
</button>
