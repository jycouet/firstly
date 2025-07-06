<script lang="ts">
	import { Body, Button, Column, Head, Html, Section, Text } from 'sailkit'

	interface Props {
		primaryColor?: string
		secondaryColor?: string

		subject: string
		preview: string

		title: string

		sections: {
			text: string
			cta?: { text: string; link: string } | undefined
		}[]
	}

	const {
		primaryColor = '#5B68DF',
		secondaryColor = '#ecedee',

		subject = 'Welcome',
		preview = 'Firstly, Hello!',
		title,
		sections,
	}: Props = $props()
</script>

<Html>
	<Head {subject} {preview} styles={{}} />
	<Body backgroundColor="#ffffff">
		<Section padding="0px">
			<Column>
				<Column.Spacer />
			</Column>
		</Section>

		<Section backgroundColor={primaryColor} paddingBottom="0px" paddingTop="0px" borderRadius="10px">
			<Column verticalAlign="top" width="100%">
				<Text
					align="left"
					color="#ffffff"
					fontSize="30px"
					fontWeight="bold"
					fontFamily="open Sans Helvetica, Arial, sans-serif"
					paddingLeft="25px"
					paddingRight="25px"
					paddingBottom="30px"
					paddingTop="30px"
				>
					{title}
				</Text>
			</Column>
		</Section>

		<Section padding="0px">
			<Column>
				<Column.Spacer />
			</Column>
		</Section>

		{#each sections as section}
			<Section backgroundColor={section.cta ? secondaryColor : ''} borderRadius="10px">
				<Column verticalAlign="middle" width="100%">
					<Text align="left" color="#000000">
						{section.text}
					</Text>

					{#if section.cta}
						<Button backgroundColor={primaryColor} borderRadius="5px" href={section.cta.link}>
							{section.cta.text}</Button
						>
					{/if}
				</Column>
			</Section>

			<Section padding="0px">
				<Column>
					<Column.Spacer />
				</Column>
			</Section>
		{/each}
	</Body>
</Html>
