/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { gql, useMutation } from '@apollo/client'
import type {
	MutationCreateServiceAnswerArgs,
	ServiceAnswerInput
} from '@cbosuite/schema/dist/client-types'
import { ServiceAnswerFields } from '../fragments'
import { useToasts } from '~hooks/useToasts'
import { useTranslation } from '~hooks/useTranslation'
import { useCallback } from 'react'

const CREATE_SERVICE_ANSWERS = gql`
	${ServiceAnswerFields}

	mutation createServiceAnswer($serviceAnswer: ServiceAnswerInput!) {
		createServiceAnswer(serviceAnswer: $serviceAnswer) {
			message
			serviceAnswer {
				...ServiceAnswerFields
			}
		}
	}
`

export type AddServiceAnswerCallback = (service: ServiceAnswerInput) => Promise<boolean>

export function useAddServiceAnswerCallback(refetch: () => void): AddServiceAnswerCallback {
	const { c } = useTranslation()
	const { success, failure } = useToasts()
	const [addServiceAnswers] = useMutation<any, MutationCreateServiceAnswerArgs>(
		CREATE_SERVICE_ANSWERS
	)

	return useCallback(
		async (_serviceAnswer: ServiceAnswerInput) => {
			try {
				// Filter out empty answers
				const serviceAnswer = {
					..._serviceAnswer,
					fields: _serviceAnswer.fields.map((field) => {
						const f = field

						// Single field value
						if (typeof field.value !== 'undefined' && !field.value) f.value = ''

						// Multi field value
						if (typeof field.values !== 'undefined' && !field.values) f.values = []

						return f
					})
				}

				await addServiceAnswers({ variables: { serviceAnswer } })
				refetch()
				success(c('hooks.useServicelist.createAnswerSuccess'))
				return true
			} catch (error) {
				failure(c('hooks.useServicelist.createAnswerFailed'))
				return false
			}
		},
		[c, success, failure, refetch, addServiceAnswers]
	)
}
