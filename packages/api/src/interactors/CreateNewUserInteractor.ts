/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { MutationCreateNewUserArgs, UserResponse } from '@cbosuite/schema/dist/provider-types'
import { UserInputError } from 'apollo-server-errors'
import { Transporter } from 'nodemailer'
import { Configuration, Localization } from '~components'
import { UserCollection } from '~db'
import { createDBUser, createGQLUser } from '~dto'
import { Interactor, RequestContext } from '~types'
import { getAccountCreatedHTMLTemplate, createLogger, generatePassword } from '~utils'
import { SuccessUserResponse } from '~utils/response'

const logger = createLogger('interactors:create-new-user')

export class CreateNewUserInteractor
	implements Interactor<MutationCreateNewUserArgs, UserResponse>
{
	public constructor(
		private readonly localization: Localization,
		private readonly mailer: Transporter,
		private readonly users: UserCollection,
		private readonly config: Configuration
	) {}

	public async execute(
		{ user }: MutationCreateNewUserArgs,
		{ locale }: RequestContext
	): Promise<UserResponse> {
		const checkUser = await this.users.count({
			email: user.email
		})

		if (checkUser !== 0) {
			throw new UserInputError(this.localization.t('mutation.createNewUser.emailExist', locale))
		}

		// If env is production and sendmail is not configured, don't create user.
		if (!this.config.isEmailEnabled && this.config.failOnMailNotEnabled) {
			throw new Error(this.localization.t('mutation.createNewUser.emailNotConfigured', locale))
		}

		// Generate random password
		const password = generatePassword(16)

		// Create a dbabase object from input values
		const newUser = createDBUser(user, password)

		await Promise.all([this.users.insertItem(newUser)])

		let successMessage = this.localization.t('mutation.createNewUser.success', locale)
		const loginLink = `${this.config.origin}/login`
		if (this.config.isEmailEnabled) {
			try {
				await this.mailer.sendMail({
					from: `${this.localization.t('mutation.createNewUser.emailHTML.header', locale)} "${
						this.config.defaultFromAddress
					}"`,
					to: user.email,
					subject: this.localization.t('mutation.createNewUser.emailSubject', locale),
					text: this.localization.t('mutation.createNewUser.emailBody', locale, { password }),
					html: getAccountCreatedHTMLTemplate(loginLink, password, locale, this.localization)
				})
			} catch (error) {
				logger('error sending mail', error)
				throw new Error(this.localization.t('mutation.createNewUser.emailNotConfigured', locale))
			}
		} else {
			// return temp password to display in console log.
			successMessage = `SUCCESS_NO_MAIL: account temporary password: ${password}`
		}

		return new SuccessUserResponse(successMessage, createGQLUser(newUser, true))
	}
}
