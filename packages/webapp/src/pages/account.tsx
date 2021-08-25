/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import ContainerLayout from '~layouts/ContainerLayout'
import ProfileForm from '~forms/ProfileForm'
import { memo } from 'react'
import { useTranslation } from '~hooks/useTranslation'
import ClientOnly from '~ui/ClientOnly'
import { useCurrentUser } from '~hooks/api/useCurrentUser'

const AccountPage = memo(function AccountPage(): JSX.Element {
	const { t } = useTranslation('account')
	const { currentUser } = useCurrentUser()

	return (
		<ContainerLayout documentTitle={t('pageTitle')}>
			<ClientOnly>
				<ProfileForm user={currentUser} />
			</ClientOnly>
		</ContainerLayout>
	)
})
export default AccountPage
