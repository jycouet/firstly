import { Entity, Fields } from 'remult'
import { AtRecord, Roles_Atproto } from 'firstly/atproto'

// Our own lexicon: the PDS stores it as-is (unknown lexicons are not validated).
@Entity<FfNote>('fun.firstly.demo.note', {
	caption: 'Firstly notes',
	allowApiRead: true,
	allowApiInsert: Roles_Atproto.Atproto_Test,
	allowApiUpdate: Roles_Atproto.Atproto_Test,
	allowApiDelete: Roles_Atproto.Atproto_Test,
	defaultOrderBy: { rkey: 'desc' },
	hub: {
		cells: ['title', 'body', 'done', 'createdAt'],
		insert: { cells: ['title', 'body'] },
		update: { cells: ['title', 'body', 'done'] },
		delete: {},
	},
})
export class FfNote extends AtRecord {
	@Fields.string({ required: true, placeholder: 'My first note' }) title = ''
	@Fields.string({ placeholder: 'markdown, anything', ui: { inputType: 'textarea' } }) body = ''
	@Fields.boolean() done = false
	@Fields.createdAt() createdAt = new Date()
}

// A review of a draft, written by a member into their own repo in the space.
@Entity<FfReview>('fun.firstly.demo.review', {
	caption: 'Firstly reviews',
	allowApiRead: true,
	allowApiInsert: Roles_Atproto.Atproto_Test,
	allowApiDelete: Roles_Atproto.Atproto_Test,
	defaultOrderBy: { rkey: 'desc' },
})
export class FfReview extends AtRecord {
	@Fields.string({ required: true }) noteUri = ''
	@Fields.string({ required: true }) text = ''
	@Fields.createdAt() createdAt = new Date()
}

// airspace's demo lexicon, so a getair.space throwaway account shows the same notes here.
@Entity<GetairNote>('space.getair.notes.note', {
	caption: 'getair notes',
	allowApiRead: true,
	allowApiInsert: Roles_Atproto.Atproto_Test,
	allowApiUpdate: Roles_Atproto.Atproto_Test,
	allowApiDelete: Roles_Atproto.Atproto_Test,
	defaultOrderBy: { rkey: 'desc' },
})
export class GetairNote extends AtRecord {
	@Fields.string({ required: true }) title = ''
	@Fields.string({ ui: { inputType: 'textarea' } }) body = ''
	@Fields.createdAt() createdAt = new Date()
}
