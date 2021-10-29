/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import {
	MutationUpdateServiceAnswerArgs,
	ServiceAnswerResponse
} from '@cbosuite/schema/dist/provider-types'
import { UserInputError } from 'apollo-server-errors'
import { Localization } from '~components'
import { DbServiceAnswer, ServiceCollection } from '~db'
import { ServiceAnswerCollection } from '~db/ServiceAnswerCollection'
import { createDbServiceAnswerField } from '~dto/createDbServiceAnswerField'
import { createGQLServiceAnswer } from '~dto/createGQLServiceAnswer'
import { Interactor, RequestContext } from '~types'
import { validateAnswer } from '~utils/formValidation'
import { empty } from '~utils/noop'
import { SuccessServiceAnswerResponse } from '~utils/response'
import { defaultClient as appInsights } from 'applicationinsights'

export class UpdateServiceAnswerInteractor
	implements Interactor<MutationUpdateServiceAnswerArgs, ServiceAnswerResponse>
{
	public constructor(
		private readonly localization: Localization,
		private readonly services: ServiceCollection,
		private readonly serviceAnswers: ServiceAnswerCollection
	) {}

	public async execute(
		{ serviceAnswer: input }: MutationUpdateServiceAnswerArgs,
		{ locale }: RequestContext
	): Promise<ServiceAnswerResponse> {
		if (!input.id) {
			throw new UserInputError(
				this.localization.t('mutation.updateServiceAnswers.answerIdRequired', locale)
			)
		}

		const { item: answer } = await this.serviceAnswers.itemById(input.id)
		if (!answer) {
			throw new UserInputError(
				this.localization.t('mutation.updateServiceAnswers.answerNotFound', locale)
			)
		}
		const { item: service } = await this.services.itemById(answer.service_id)
		if (!service) {
			throw new UserInputError(
				this.localization.t('mutation.updateServiceAnswers.serviceNotFound', locale)
			)
		}

		validateAnswer(service, input)

		const update: Partial<DbServiceAnswer> = {
			contacts: input.contacts || empty,
			fields: input.fields?.map(createDbServiceAnswerField) ?? empty
		}

		//update the service answer
		try {
			await this.serviceAnswers.updateItem({ id: input.id }, { $set: update })
		} catch (err) {
			throw err
		}

		appInsights.trackEvent({ name: 'UpdateServiceAnswer' })
		return new SuccessServiceAnswerResponse(
			this.localization.t('mutation.updateServiceAnswers.success', locale),
			createGQLServiceAnswer({ ...answer, ...update })
		)
	}
}
