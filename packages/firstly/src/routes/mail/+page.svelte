<script lang="ts">
	import { MailController } from '$modules/mail/MailController'
	import { Button } from 'firstly/internals'

	import type { PageProps } from './$types'

	const { data }: PageProps = $props()
</script>

<Button
	onclick={() => {
		MailController.sendMail()
	}}
>
	Send test mail
</Button>
<br />
<br />
<hr />
<br />
<br />

<h2 class="text-2xl font-bold">Mail mjm</h2>

<section>
	<h2 class="text-xl font-bold">HTML</h2>
	<div class="border border-primary">
		{@html data.html}
	</div>
</section>

<section class="mt-4">
	<h2 class="text-xl font-bold">PLAIN TEXT</h2>
	<div class="border border-primary">
		<p>{data.plainText}</p>
	</div>
</section>

<br />
<br />
<br />


