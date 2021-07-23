/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { useMutation, gql } from '@apollo/client'
import type {
	UserInput,
	AuthenticationResponse,
	User,
	UserResponse
} from '@resolve/schema/lib/client-types'
import { GET_ORGANIZATION, useOrganization } from './useOrganization'
import { useRecoilValue } from 'recoil'
import { userAuthState } from '~store'
import { cloneDeep } from 'lodash'
import { ApiResponse } from './types'
import useToasts from '~hooks/useToasts'
import { useTranslation } from '~hooks/useTranslation'
import { UserFields } from './fragments'

const CREATE_NEW_SPECIALIST = gql`
	${UserFields}

	mutation createNewUser($body: UserInput!) {
		createNewUser(body: $body) {
			user {
				...UserFields
			}
			message
			status
		}
	}
`

const UPDATE_SPECIALIST = gql`
	${UserFields}

	mutation updateUser($body: UserInput!) {
		updateUser(body: $body) {
			user {
				...UserFields
			}
			message
			status
		}
	}
`

interface useSpecialistReturn extends ApiResponse<User[]> {
	createSpecialist: (user: UserInput) => Promise<{ status: string; message?: string }>
	updateSpecialist: (user: UserInput) => Promise<{ status: string; message?: string }>
	specialistList: User[]
}

export function useSpecialist(): useSpecialistReturn {
	const { c } = useTranslation()
	const { success, failure } = useToasts()
	const authUser = useRecoilValue<AuthenticationResponse>(userAuthState)
	const { loading, error, organization } = useOrganization()

	if (error) {
		console.error(c('hooks.useSpecialist.loadData.failed'), error)
	}

	const specialistList: User[] = organization?.users || []

	const [createNewUser] = useMutation(CREATE_NEW_SPECIALIST)
	const [updateUser] = useMutation(UPDATE_SPECIALIST)

	const createSpecialist: useSpecialistReturn['createSpecialist'] = async newUser => {
		const result = {
			status: 'failed',
			message: null
		}

		try {
			await createNewUser({
				variables: { body: newUser },
				update(cache, { data }) {
					const orgId = authUser.user.roles[0].orgId
					const createNewUserResp = data.createNewUser as UserResponse

					if (createNewUserResp.status === 'SUCCESS') {
						const existingOrgData = cache.readQuery({
							query: GET_ORGANIZATION,
							variables: { body: { orgId } }
						}) as any

						const newData = cloneDeep(existingOrgData.organization)
						newData.users.push(createNewUserResp.user)
						newData.users.sort((a: User, b: User) => (a.name.first > b.name.first ? 1 : -1))

						cache.writeQuery({
							query: GET_ORGANIZATION,
							variables: { body: { orgId } },
							data: { organization: newData }
						})
						result.status = 'success'

						success(c('hooks.useSpecialist.createSpecialist.success'))
					}
					if (createNewUserResp?.message.startsWith('SUCCESS_NO_MAIL')) {
						// For dev use only
						console.log(createNewUserResp.message)
					}
					result.message = createNewUserResp.message
				}
			})
		} catch (error) {
			result.message = error
			failure(c('hooks.useSpecialist.createSpecialist.failed'), error)
		}

		return result
	}

	const updateSpecialist: useSpecialistReturn['updateSpecialist'] = async user => {
		const result = {
			status: 'failed',
			message: null
		}

		try {
			await updateUser({
				variables: { body: user },
				update(cache, { data }) {
					const orgId = authUser.user.roles[0].orgId
					const updateUserResp = data.updateUser as UserResponse

					if (updateUserResp.status === 'SUCCESS') {
						const existingOrgData = cache.readQuery({
							query: GET_ORGANIZATION,
							variables: { body: { orgId } }
						}) as any

						const orgData = cloneDeep(existingOrgData.organization)
						const userIdx = orgData.users.findIndex((u: User) => u.id === updateUserResp.user.id)
						orgData.users[userIdx] = updateUserResp.user

						cache.writeQuery({
							query: GET_ORGANIZATION,
							variables: { body: { orgId } },
							data: { organization: orgData }
						})

						success(c('hooks.useSpecialist.updateSpecialist.success'))
						result.status = 'success'
					}

					result.message = updateUserResp.message
				}
			})
		} catch (error) {
			result.message = error
			failure(c('hooks.useSpecialist.updateSpecialist.failed'), error)
		}

		return result
	}

	return {
		loading,
		error,
		createSpecialist,
		updateSpecialist,
		specialistList
	}
}
