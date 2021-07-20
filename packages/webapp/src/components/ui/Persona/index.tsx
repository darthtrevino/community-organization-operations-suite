/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { ContextualMenu, Persona, PersonaSize } from '@fluentui/react'
import cx from 'classnames'
import { useRouter } from 'next/router'
import { memo, useRef, useState } from 'react'
import style from './index.module.scss'
import ComponentProps from '~types/ComponentProps'
import { useAuthUser } from '~hooks/api/useAuth'
import { useTranslation } from '~hooks/useTranslation'
import { useCurrentUser } from '~hooks/api/useCurrentuser'
import ClientOnly from '~ui/ClientOnly'

const CustomPersona = memo(function CustomPersona({ className }: ComponentProps): JSX.Element {
	const [personaMenuOpen, setPersonaMenuOpen] = useState(false)
	const personaComponent = useRef(null)
	const router = useRouter()
	const { authUser, logout } = useAuthUser()
	const { c } = useTranslation()
	const { currentUser } = useCurrentUser()

	if (!authUser?.accessToken) return null

	const { first: firstName } = currentUser.name

	return (
		<div className={className}>
			<div
				onClick={() => setPersonaMenuOpen(true)}
				className={cx(style.persona, 'd-flex align-items-center')}
			>
				{/* TODO: remove stack in favor of styled div component */}
				<div className='d-flex align-items-center justify-content-center'>
					<div className='pr-3 me-3'>{c('persona.title', { firstName })}</div>
					<ClientOnly>
						<Persona
							ref={personaComponent}
							text={firstName}
							size={PersonaSize.size32}
							hidePersonaDetails
						/>

						<ContextualMenu
							items={[
								{
									key: 'viewAccount',
									text: c('personaMenu.account.text'),
									onClick: () => router.push('/account')
								},
								{
									key: 'logoutUserPersonaMenu',
									text: c('personaMenu.logout.text'),
									onClick: () => {
										router.push('/logout')
										logout()
									}
								}
							]}
							hidden={!personaMenuOpen}
							target={personaComponent}
							onItemClick={() => setPersonaMenuOpen(false)}
							onDismiss={() => setPersonaMenuOpen(false)}
						/>
					</ClientOnly>
				</div>
			</div>
		</div>
	)
})
export default CustomPersona
