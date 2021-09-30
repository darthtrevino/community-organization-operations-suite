/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */

import styles from './index.module.scss'
import type ComponentProps from '~types/ComponentProps'
import ClientOnly from '~components/ui/ClientOnly'
import { memo } from 'react'
import Footer from '~components/ui/Footer'
import { useTranslation } from '~hooks/useTranslation'
import { wrap } from '~utils/appinsights'
import { Title } from '~components/ui/Title'

interface LoginLayoutProps extends ComponentProps {
	title?: string
}

const LoginLayout = memo(function LoginLayout({ children }: LoginLayoutProps): JSX.Element {
	const { t } = useTranslation('login')
	const title = t('pageTitle')
	return (
		<ClientOnly>
			<>
				<Title title={title} />
				<div className={styles.root}>
					{children}

					<Footer />
				</div>
			</>
		</ClientOnly>
	)
})
export default wrap(LoginLayout)
