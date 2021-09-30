/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
/* eslint-disable @essex/adjacent-await */
import path from 'path'
import fs from 'fs'
import { Authenticator } from './Authenticator'
import { Configuration } from './Configuration'
import { Notifications } from './Notifications'
import { DatabaseConnector } from './DatabaseConnector'
import { Localization } from './Localization'
import {
	ContactCollection,
	OrganizationCollection,
	UserCollection,
	UserTokenCollection,
	EngagementCollection,
	TagCollection,
	ServiceCollection
} from '~db'
import { AsyncProvider, BuiltAppContext } from '~types'
import nodemailer from 'nodemailer'
import { PubSub } from 'graphql-subscriptions'
import { AuthenticateInteractor } from '~interactors/AuthenticateInteractor'
import { CreateEngagementInteractor } from '~interactors/CreateEngagementInteractor'
import { AssignEngagementInteractor } from '~interactors/AssignEngagementInteractor'
import { UpdateEngagementInteractor } from '~interactors/UpdateEngagementInteractor'
import { CompleteEngagementInteractor } from '~interactors/CompleteEngagementInteractor'
import { SetEngagementStatusInteractor } from '~interactors/SetEngagementStatusInteractor'
import { AddEngagementInteractor } from '~interactors/AddEngagementInteractor'
import { ForgotUserPasswordInteractor } from '~interactors/ForgotUserPasswordInteractor'
import { ValidateResetUserPasswordTokenInteractor } from '~interactors/ValidateResetUserPasswordTokenInteractor'
import { ChangeUserPasswordInteractor } from '~interactors/ChangeUserPasswordInteractor'
import { ResetUserPasswordInteractor } from '~interactors/ResetUserPasswordInteractor'
import { SetUserPasswordInteractor } from '~interactors/SetUserPasswordInteractor'
import { CreateNewUserInteractor } from '~interactors/CreateNewUserInteractor'
import { DeleteUserInteractor } from '~interactors/DeleteUserInteractor'
import { UpdateUserInteractor } from '~interactors/UpdateUserInteractor'
import { UpdateUserFCMTokenInteractor } from '~interactors/UpdateUserFCMTokenInteractor'
import { MarkMentionSeenInteractor } from '~interactors/MarkMentionSeenInteractor'
import { MarkMentionDismissedInteractor } from '~interactors/MarkMentionDismissedInteractor'
import { CreateNewTagInteractor } from '~interactors/CreateNewTagInteractor'
import { UpdateContactInteractor } from '~interactors/UpdateContactInteractor'
import { ArchiveContactInteractor } from '~interactors/ArchiveContactInteractor'
import { CreateServiceInteractor } from '~interactors/CreateServiceInteractor'
import { UpdateServiceInteractor } from '~interactors/UpdateServiceInteractor'
import { CreateContactInteractor } from '~interactors/CreateContactInteractor'
import { UpdateTagInteractor } from '~interactors/UpdateTagInteractor'
import { CreateServiceAnswersInteractor } from '~interactors/CreateServiceAnswersInteractor'
import { DeleteServiceAnswerInteractor } from '~interactors/DeleteServiceAnswerInteractor'
import { UpdateServiceAnswerInteractor } from '~interactors/UpdateServiceAnswerInteractor'
import { Migrator } from './Migrator'

const sgTransport = require('nodemailer-sendgrid-transport')

export class AppContextProvider implements AsyncProvider<BuiltAppContext> {
	#config: Configuration

	public constructor(config: Configuration) {
		this.#config = config
	}

	public async get(): Promise<BuiltAppContext> {
		const config = this.#config
		const conn = new DatabaseConnector(config)
		// Automigrate for integration testing, local development, etc.
		await performDatabaseMigrations(config)
		await conn.connect()
		const userCollection = new UserCollection(conn.usersCollection)
		const userTokenCollection = new UserTokenCollection(conn.userTokensCollection)
		const orgCollection = new OrganizationCollection(conn.orgsCollection)
		const tagCollection = new TagCollection(conn.tagsCollection)
		const localization = new Localization()
		const notifier = new Notifications(config)
		const mailer = nodemailer.createTransport(
			sgTransport({
				auth: {
					api_key: config.sendgridApiKey
				}
			})
		)
		const authenticator = new Authenticator(
			userCollection,
			userTokenCollection,
			config.jwtTokenSecret,
			mailer
		)
		const contactCollection = new ContactCollection(conn.contactsCollection)
		const engagementCollection = new EngagementCollection(conn.engagementsCollection)
		const serviceCollection = new ServiceCollection(conn.servicesCollection)
		const pubsub = new PubSub()

		return {
			config,
			pubsub,
			interactors: {
				authenticate: new AuthenticateInteractor(authenticator, localization),
				createEngagement: new CreateEngagementInteractor(
					localization,
					pubsub,
					engagementCollection,
					userCollection,
					notifier
				),
				assignEngagement: new AssignEngagementInteractor(
					localization,
					pubsub,
					engagementCollection,
					userCollection,
					notifier
				),
				updateEngagement: new UpdateEngagementInteractor(
					localization,
					pubsub,
					engagementCollection,
					userCollection
				),
				completeEngagement: new CompleteEngagementInteractor(
					localization,
					engagementCollection,
					pubsub
				),
				setEngagementStatus: new SetEngagementStatusInteractor(
					localization,
					engagementCollection,
					pubsub
				),
				addEngagement: new AddEngagementInteractor(
					localization,
					engagementCollection,
					userCollection,
					pubsub
				),
				forgotUserPassword: new ForgotUserPasswordInteractor(
					config,
					localization,
					authenticator,
					userCollection,
					mailer
				),
				validateResetUserPasswordToken: new ValidateResetUserPasswordTokenInteractor(
					localization,
					authenticator,
					userCollection
				),
				changeUserPassword: new ChangeUserPasswordInteractor(
					localization,
					authenticator,
					userCollection
				),
				resetUserPassword: new ResetUserPasswordInteractor(
					localization,
					config,
					authenticator,
					mailer,
					userCollection
				),
				setUserPassword: new SetUserPasswordInteractor(localization, authenticator),
				createNewUser: new CreateNewUserInteractor(
					localization,
					authenticator,
					mailer,
					userCollection,
					orgCollection,
					config
				),
				deleteUser: new DeleteUserInteractor(
					localization,
					userCollection,
					userTokenCollection,
					orgCollection,
					engagementCollection
				),
				updateUser: new UpdateUserInteractor(localization, userCollection),
				updateUserFCMToken: new UpdateUserFCMTokenInteractor(localization, userCollection),
				markMentionSeen: new MarkMentionSeenInteractor(localization, userCollection),
				markMentionDismissed: new MarkMentionDismissedInteractor(localization, userCollection),
				createNewTag: new CreateNewTagInteractor(localization, tagCollection, orgCollection),
				updateTag: new UpdateTagInteractor(localization, tagCollection),
				createContact: new CreateContactInteractor(localization, contactCollection, orgCollection),
				updateContact: new UpdateContactInteractor(
					localization,
					config,
					contactCollection,
					tagCollection,
					engagementCollection,
					orgCollection
				),
				archiveContact: new ArchiveContactInteractor(
					localization,
					config,
					contactCollection,
					tagCollection,
					engagementCollection,
					orgCollection
				),
				createService: new CreateServiceInteractor(localization, serviceCollection),
				updateService: new UpdateServiceInteractor(localization, serviceCollection),
				createServiceAnswers: new CreateServiceAnswersInteractor(localization, serviceCollection),
				deleteServiceAnswer: new DeleteServiceAnswerInteractor(localization, serviceCollection),
				updateServiceAnswer: new UpdateServiceAnswerInteractor(localization, serviceCollection)
			},
			collections: {
				users: userCollection,
				orgs: orgCollection,
				contacts: contactCollection,
				userTokens: userTokenCollection,
				engagements: engagementCollection,
				tags: tagCollection,
				services: serviceCollection
			},
			components: {
				mailer,
				authenticator,
				dbConnector: conn,
				localization,
				notifier
			}
		}
	}
}

async function performDatabaseMigrations(config: Configuration) {
	// This should prevent accidental seed data from accidentally being inserted into Azure environments
	// (e.g. when a dev uses an env-var override locally)
	const isSeedTargetStable = config.dbSeedConnectionString === config.dbConnectionString
	if (!isSeedTargetStable) {
		console.warn('unstable seed target, skipping DB seeding')
	} else {
		const migrator = new Migrator(config)
		await migrator.connect()
		if (config.dbAutoMigrate) {
			await migrator.up()
		}

		if (config.dbSeedMockData) {
			const SEED_FILE_ROOT = path.join(__dirname, '../../mock_data')
			const seedFiles = fs.readdirSync(SEED_FILE_ROOT).map((f) => path.join(SEED_FILE_ROOT, f))
			// Seed the mock data fresh (delete old data)
			await migrator.seed(seedFiles, true)
		}
	}
}
