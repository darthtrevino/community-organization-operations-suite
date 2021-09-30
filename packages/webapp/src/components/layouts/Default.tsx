/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */

import { useRouter } from 'next/router'
import { FC, memo, useEffect } from 'react'
import Footer from '~components/ui/Footer'
import { useAuthUser } from '~hooks/api/useAuth'
import ClientOnly from '~ui/ClientOnly'
import { wrap } from '~utils/appinsights'
import { PushNotifications } from '~components/ui/PushNotifications'

const DefaultLayout: FC = memo(function DefaultLayout({ children }): JSX.Element {
	const router = useRouter()
	const { accessToken } = useAuthUser()

	// FIXME: resolve comments; make sure this isn't needed
	useEffect(() => {
		if (!accessToken && router.route !== '/login') {
			void router.push('/login')
		}
	}, [accessToken, router.pathname, router])

	return (
		<>
			{accessToken && <PushNotifications />}
			{children}
			<ClientOnly>
				<Footer />
			</ClientOnly>
		</>
	)
})
export default wrap(DefaultLayout)
