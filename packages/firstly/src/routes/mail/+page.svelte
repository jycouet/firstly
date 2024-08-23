<script>
  import DefaultMail from '$lib/mail/templates/DefaultMail.svelte'
</script>

<div class="border-primary border">
  <DefaultMail
    title="firstly 👋"
    previewText="This is the mail you were waiting for"
    sections={[
      {
        text: 'Then, How are you today ?',
        highlighted: true,
      },
      {
        text: 'Did you star the repo ?',
        cta: { text: 'Check it out', link: 'https:github.com/jycouet/firstly' },
      },
    ]}
  ></DefaultMail>
</div>
