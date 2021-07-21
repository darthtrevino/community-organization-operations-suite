/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { QueryResolvers, Contact, Attribute, Delegate } from '@resolve/schema/lib/provider-types'
import { createGQLContact, createGQLOrganization, createGQLUser, createGQLEngagement } from '~dto'
import { createGQLAttribute } from '~dto/createGQLAttribute'
import { createGQLDelegate } from '~dto/createGQLDelegate'
import { AppContext } from '~types'
import { sortByDate } from '~utils'

export const Query: QueryResolvers<AppContext> = {
	organizations: async (_, { body }, context) => {
		const offset = body.offset || context.config.defaultPageOffset
		const limit = body.limit || context.config.defaultPageLimit
		const result = await context.collections.orgs.items({ offset, limit })
		return result.items.map((r) => createGQLOrganization(r))
	},
	organization: async (_, { body }, context) => {
		const result = await context.collections.orgs.itemById(body.orgId)
		return result.item ? createGQLOrganization(result.item) : null
	},
	user: async (_, { body }, context) => {
		const result = await context.collections.users.itemById(body.userId)
		if (!result.item) {
			return null
		}

		const [active, closed] = await Promise.all([
			await context.collections.engagements.count({
				user_id: result.item.id,
				status: { $ne: 'CLOSED' }
			}),
			await context.collections.engagements.count({
				user_id: result.item.id,
				status: { $eq: 'CLOSED' }
			})
		])

		return createGQLUser(result.item, { active, closed })
	},
	contact: async (_, { body }, context) => {
		const offset = context.config.defaultPageOffset
		const limit = context.config.defaultPageLimit
		const result = await context.collections.contacts.itemById(body.contactId)
		const engagements = await context.collections.engagements.items(
			{ offset, limit },
			{
				contact_id: result?.item?.id
			}
		)
		const eng = engagements.items.map((engagement) => createGQLEngagement(engagement))

		const orgData = await context.collections.orgs.itemById(String(result.item?.org_id))
		const attributes: Attribute[] = []
		if (result.item?.attributes) {
			result.item?.attributes.forEach((attrId) => {
				const attr = orgData.item?.attributes?.find((a) => a.id === attrId)
				if (attr) {
					attributes.push(createGQLAttribute(attr))
				}
			})
		}

		return result.item ? createGQLContact(result.item, eng, attributes) : null
	},
	contacts: async (_, { body }, context) => {
		const offset = body.offset || context.config.defaultPageOffset
		const limit = body.limit || context.config.defaultPageLimit
		const result = await context.collections.contacts.items(
			{ offset, limit },
			{ org_id: body.orgId }
		)

		const contactList = await Promise.all(
			result.items.map(async (r) => {
				const engagements = await context.collections.engagements.items(
					{ offset, limit },
					{
						contact_id: r.id
					}
				)
				const eng = engagements.items.map((engagement) => createGQLEngagement(engagement))

				const orgData = await context.collections.orgs.itemById(body.orgId)
				const attributes: Attribute[] = []
				r.attributes?.forEach((attrId) => {
					const attr = orgData.item?.attributes?.find((a) => a.id === attrId)
					if (attr) {
						attributes.push(createGQLAttribute(attr))
					}
				})
				return createGQLContact(r, eng, attributes)
			})
		)

		return contactList.sort((a: Contact, b: Contact) => (a.name.first > b.name.first ? 1 : -1))
	},
	engagement: async (_, { body }, context) => {
		const result = await context.collections.engagements.itemById(body.engId)
		return result.item ? createGQLEngagement(result.item) : null
	},
	activeEngagements: async (_, { body }, context) => {
		const orgId = body.orgId
		const offset = body.offset || context.config.defaultPageOffset
		const limit = body.limit || context.config.defaultPageLimit

		const result = await context.collections.engagements.items(
			{ offset, limit },
			{
				org_id: orgId,
				status: { $nin: ['CLOSED', 'COMPLETED'] }
			}
		)

		return result.items
			.sort((a, b) => sortByDate({ date: a.start_date }, { date: b.start_date }))
			.map((r) => createGQLEngagement(r))
	},
	inactiveEngagements: async (_, { body }, context) => {
		const orgId = body.orgId
		const offset = body.offset || context.config.defaultPageOffset
		const limit = body.limit || context.config.defaultPageLimit

		const result = await context.collections.engagements.items(
			{ offset, limit },
			{
				org_id: orgId,
				status: { $in: ['CLOSED', 'COMPLETED'] }
			}
		)

		return result.items
			.sort((a, b) => sortByDate({ date: a.end_date as string }, { date: b.end_date as string }))
			.map((r) => createGQLEngagement(r))
	},
	exportData: async (_, { body }, context) => {
		const result = await context.collections.engagements.items(
			{},
			{
				org_id: body.orgId
			}
		)

		return result.items
			.sort((a, b) => sortByDate({ date: a.start_date }, { date: b.start_date }))
			.map((r) => createGQLEngagement(r))
	},
	delegates: async (_, { body }, context) => {
		const result = await context.collections.engagements.items({}, { contact_id: body.contactId })

		if (result?.items.length === 0) {
			return null
		}

		const delegate = await Promise.all(
			result.items.map(async (item) => {
				if (item?.user_id) {
					const user = await context.collections.users.itemById(item.user_id as string)
					if (user.item) {
						const orgs = await context.collections.orgs.items(
							{},
							{ users: { $in: [user.item?.id as string] } }
						)
						return createGQLDelegate(user.item, orgs.items)
					}
				}
				return null
			})
		)

		return delegate
	}
}
