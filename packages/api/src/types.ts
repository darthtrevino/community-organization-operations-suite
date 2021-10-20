/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import {
	AuthenticationInput,
	AuthenticationResponse,
	ChangeUserPasswordInput,
	ContactInput,
	ContactIdInput,
	ContactResponse,
	EngagementActionInput,
	EngagementIdInput,
	EngagementInput,
	EngagementResponse,
	EngagementUserInput,
	ForgotUserPasswordInput,
	MentionUserInput,
	OrgTagInput,
	PasswordChangeInput,
	RoleType,
	ServiceInput,
	ServiceAnswerInput,
	ServiceResponse,
	TagResponse,
	UserFcmInput,
	UserIdInput,
	UserInput,
	UserResponse,
	ValidateResetUserPasswordTokenInput,
	VoidResponse,
	ServiceAnswerIdInput,
	ServiceAnswerResponse,
	OrganizationsInput,
	Organization,
	User as ServiceUser,
	Contact,
	ContactsInput,
	Engagement,
	EngagementsInput,
	Service,
	ServiceAnswersInput,
	ServiceAnswer,
	QueryOrganizationArgs,
	QueryExportDataArgs,
	QueryServicesArgs,
	QueryUserArgs
} from '@cbosuite/schema/dist/provider-types'
import { Configuration, Authenticator, Localization, Notifications } from '~components'
import { DatabaseConnector } from '~components/DatabaseConnector'
import {
	ContactCollection,
	DbUser,
	OrganizationCollection,
	UserCollection,
	UserTokenCollection,
	EngagementCollection,
	TagCollection,
	ServiceCollection
} from '~db'
import { PubSub } from 'graphql-subscriptions'
import { Transporter } from 'nodemailer'
import { ServiceAnswerCollection } from '~db/ServiceAnswerCollection'

export interface Interactor<I, O> {
	execute(input: I, requestCtx: RequestContext): Promise<O>
}

export interface Provider<T> {
	get(): T
}
export interface AsyncProvider<T> {
	get(): Promise<T>
}

export type User = DbUser

export interface AuthArgs {
	/**
	 * The ID of the organization being authenticated into
	 */
	orgId: string
	requires: RoleType
}

export interface BuiltAppContext {
	pubsub: PubSub
	config: Configuration
	interactors: {
		/**
		 * Queries
		 */
		getOrganizations: Interactor<OrganizationsInput, Organization[]>
		getOrganization: Interactor<QueryOrganizationArgs, Organization | null>
		getUser: Interactor<QueryUserArgs, ServiceUser | null>
		getContact: Interactor<ContactIdInput, Contact | null>
		getContacts: Interactor<ContactsInput, Contact[]>
		getEngagement: Interactor<EngagementIdInput, Engagement | null>
		getActiveEngagements: Interactor<EngagementsInput, Engagement[]>
		getInactiveEngagements: Interactor<EngagementsInput, Engagement[]>
		exportData: Interactor<QueryExportDataArgs, Engagement[]>
		getServices: Interactor<QueryServicesArgs, Service[]>
		getServiceAnswers: Interactor<ServiceAnswersInput, ServiceAnswer[]>

		/**
		 * Mutators
		 */
		authenticate: Interactor<AuthenticationInput, AuthenticationResponse>
		createEngagement: Interactor<EngagementInput, EngagementResponse>
		updateEngagement: Interactor<EngagementInput, EngagementResponse>
		assignEngagement: Interactor<EngagementUserInput, EngagementResponse>
		completeEngagement: Interactor<EngagementIdInput, EngagementResponse>
		setEngagementStatus: Interactor<EngagementIdInput, EngagementResponse>
		addEngagement: Interactor<EngagementActionInput, EngagementResponse>
		forgotUserPassword: Interactor<ForgotUserPasswordInput, VoidResponse>
		validateResetUserPasswordToken: Interactor<ValidateResetUserPasswordTokenInput, VoidResponse>
		changeUserPassword: Interactor<ChangeUserPasswordInput, VoidResponse>
		resetUserPassword: Interactor<UserIdInput, UserResponse>
		setUserPassword: Interactor<PasswordChangeInput, UserResponse>
		createNewUser: Interactor<UserInput, UserResponse>
		deleteUser: Interactor<UserIdInput, VoidResponse>
		updateUser: Interactor<UserInput, UserResponse>
		updateUserFCMToken: Interactor<UserFcmInput, VoidResponse>
		markMentionSeen: Interactor<MentionUserInput, UserResponse>
		markMentionDismissed: Interactor<MentionUserInput, UserResponse>
		createNewTag: Interactor<OrgTagInput, TagResponse>
		updateTag: Interactor<OrgTagInput, TagResponse>
		createContact: Interactor<ContactInput, ContactResponse>
		updateContact: Interactor<ContactInput, ContactResponse>
		archiveContact: Interactor<ContactIdInput, VoidResponse>
		createService: Interactor<ServiceInput, ServiceResponse>
		updateService: Interactor<ServiceInput, ServiceResponse>
		createServiceAnswers: Interactor<ServiceAnswerInput, ServiceAnswerResponse>
		deleteServiceAnswer: Interactor<ServiceAnswerIdInput, VoidResponse>
		updateServiceAnswer: Interactor<ServiceAnswerInput, ServiceAnswerResponse>
	}
	components: {
		mailer: Transporter
		authenticator: Authenticator
		dbConnector: DatabaseConnector
		localization: Localization
		notifier: Notifications
	}
	collections: {
		users: UserCollection
		orgs: OrganizationCollection
		contacts: ContactCollection
		userTokens: UserTokenCollection
		engagements: EngagementCollection
		tags: TagCollection
		services: ServiceCollection
		serviceAnswers: ServiceAnswerCollection
	}
}

export interface RequestContext {
	identity: User | null // requesting user auth identity
	userId: string | null // requesting user id
	orgId: string | null // requesting org id
	locale: string
}

export interface AppContext extends BuiltAppContext {
	requestCtx: RequestContext
}
