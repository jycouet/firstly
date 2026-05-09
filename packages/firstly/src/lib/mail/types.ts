/**
 * One section in a mail body. Pure structural type, safe to import on the
 * client when building sections from a UI.
 */
export type MailSection = {
	html: string
	cta?: { html: string; link: string }
}
