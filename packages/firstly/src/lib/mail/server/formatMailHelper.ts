export type MailStyle = {
	service: string
	primaryColor: string
	secondaryColor: string

	subject: string
	title: string
	sections: {
		html: string
		cta?: { html: string; link: string } | undefined
	}[]
	footer: string
}

export const toHtml = (args: MailStyle) => {
	const { service, primaryColor, secondaryColor, title, footer, sections } = args

	return `<body style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important; color: black">
<table border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td bgcolor="${primaryColor}" align="center">
      <table border="0" cellpadding="0" cellspacing="0" width="480">
        <tr>
          <td align="center" valign="top" style="padding: 30px 10px 30px 10px;">
            <div
              style="display: block; font-family: Helvetica, Arial, sans-serif; color: #ffffff; font-size: 18px;"
              border="0"
            >
              ${service}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td bgcolor="${primaryColor}" align="center" style="padding: 0px 35px 0px 35px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td
            bgcolor="#ffffff"
            align="left"
            valign="top"
            style="padding: 30px 30px 20px 30px; border-radius: 20px 20px 0px 0px; color: #111111; font-family: Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; line-height: 48px;"
          >
            <h1 style="font-size: 32px; font-weight: 400; margin: 0;">${title}</h1>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td bgcolor="#f4f4f4" align="center" style="padding: 0px 35px 0px 35px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
          ${sections.map((section, i) => sectionToHtml(i, primaryColor, secondaryColor, section))
											.join(`
`)}
        </table>
      </td>
    </tr>
    <tr>
      <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="480">
          <tr>
            <td
              bgcolor="#f4f4f4"
              align="left"
              style="padding: 30px 30px 30px 30px; color: #666666; font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 18px;"
            >
              <center>
                ${footer}
              </center>
            </td>
          </tr>
        </table>
      </td>
		</tr>
	</table>
</body>
`
}

const sectionToHtml = (
	i: number,
	primaryColor: string,
	secondaryColor: string,
	section: {
		html: string
		cta?: { html: string; link: string } | undefined
	},
) => `
<tr>
  <td bgcolor="#ffffff" align="left">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td
          bgcolor="#ffffff"
          align="left"
          style="padding: 30px 30px 30px 30px; ${i > 0 ? `border-top:1px solid ${primaryColor};` : ''}"
        >
          ${section.html}
					${section.cta ? ctaToHtml(secondaryColor, section.cta.html, section.cta.link) : ''}
        </td>
      </tr>
    </table>
  </td>
</tr>
`

const ctaToHtml = (secondaryColor: string, html: string, href: string) => `
<tr>
  <td bgcolor="#ffffff" align="center">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td
          bgcolor="#ffffff"
          align="center"
          style="padding: 0 0 30px 0;"
        >
          <table border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td align="left" style="border-radius: 3px;" bgcolor="${secondaryColor}">
                <!-- CTA -->
                <a
                  href="${href}"
                  target="_blank"
                  style="font-size: 20px; font-family: Helvetica, Arial, sans-serif; text-decoration: none; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 2px; display: inline-block;"
                  >${html}</a
                >
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>
`
