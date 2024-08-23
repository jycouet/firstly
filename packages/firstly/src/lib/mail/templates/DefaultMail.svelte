<script lang="ts">
  import {
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
  } from 'svelte-email'

  export let previewText: string | undefined
  export let title: string | undefined
  export let sections: {
    text: string
    highlighted?: boolean
    cta?: { text: string; link: string } | undefined
  }[] = []
  export let primaryColor = '#5B68DF'

  const fontFamily =
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif'

  const main = {
    backgroundColor: '#ffffff',
  }

  const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    width: '580px',
  }

  // const userImage = {
  //   margin: '0 auto',
  //   marginBottom: '16px',
  //   borderRadius: '50%',
  // }

  const heading = {
    fontFamily,
    fontSize: '32px',
    lineHeight: '1.3',
    fontWeight: '700',
    color: '#484848',
  }

  const paragraph = {
    fontFamily,
    fontSize: '18px',
    lineHeight: '1.4',
    color: '#484848',
  }

  const highlighted = {
    ...paragraph,
    padding: '24px',
    backgroundColor: '#f2f3f3',
    borderRadius: '4px',
  }

  const button = {
    fontFamily,
    backgroundColor: primaryColor,
    borderRadius: '5px',
    color: '#fff',
    fontSize: '18px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    width: '100%',
  }
</script>

<Html>
  <Head />
  <Preview preview={previewText ?? title + '...'} />
  <Section style={main}>
    <Container style={container}>
      {#if title}
        <Heading style={heading}>{title}</Heading>
      {/if}

      {#each sections as s}
        <Text style={s.highlighted ? highlighted : paragraph}>
          {s.text}
        </Text>
        {#if s.cta}
          <Button pY={19} style={button} href={s.cta.link}>{s.cta.text}</Button>
        {/if}
      {/each}
    </Container>
  </Section>
</Html>
