/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { useRecoilState } from 'recoil'
import { isNotificationsPanelOpenState } from '~store'
import RequestPanel from '~ui/RequestPanel'
import { memo, useEffect, useState } from 'react'
import NotificationPanel from '~components/ui/NotificationsPanel'
import { useOrganization } from '~hooks/api/useOrganization'
import SpecialistPanel from '~ui/SpecialistPanel'
import ContactPanel from '~ui/ContactPanel'
import { useCurrentUser } from '~hooks/api/useCurrentUser'
import { useRouter } from 'next/router'

export const FlyoutPanels = memo(function FlyoutPanels(): JSX.Element {
	const router = useRouter()
	const { orgId } = useCurrentUser()
	const { engagement, specialist, contact } = router.query
	const [requestOpen, setRequestOpen] = useState(!!engagement)
	const [specialistOpen, setSpecialistOpen] = useState(!!specialist)
	const [contactOpen, setContactOpen] = useState(!!contact)
	const [notificationsOpen, setNotificationsOpen] = useRecoilState(isNotificationsPanelOpenState)
	const { organization } = useOrganization(orgId)

	useEffect(() => {
		if (Object.keys(router.query).length === 0) {
			setRequestOpen(false)
			setNotificationsOpen(false)
			setSpecialistOpen(false)
			setContactOpen(false)
		}
	}, [router.query, setNotificationsOpen, setRequestOpen, setSpecialistOpen, setContactOpen])

	useEffect(() => {
		// If a request is added to the router query after page load open the request panel
		// And close the notification panel
		if (typeof engagement === 'string') {
			setRequestOpen(true)
			setSpecialistOpen(false)
			setNotificationsOpen(false)
			setContactOpen(false)
		}

		if (typeof specialist === 'string') {
			setSpecialistOpen(true)
			setRequestOpen(false)
			setNotificationsOpen(false)
			setContactOpen(false)
		}

		if (typeof contact === 'string') {
			setContactOpen(true)
			setSpecialistOpen(false)
			setRequestOpen(false)
			setNotificationsOpen(false)
		}
	}, [setRequestOpen, engagement, setNotificationsOpen, setSpecialistOpen, specialist, contact, setContactOpen])

	return (
		<>
			{/* Request panel here */}
			<RequestPanel
				openPanel={requestOpen}
				onDismiss={() => {
					setRequestOpen(false)
				}}
				request={engagement ? { id: engagement as string, orgId: organization?.id } : undefined}
			/>

			<NotificationPanel
				openPanel={notificationsOpen}
				onDismiss={() => setNotificationsOpen(false)}
			/>

			<SpecialistPanel
				openPanel={specialistOpen}
				onDismiss={() => {
					setSpecialistOpen(false)
				}}
				specialistId={specialist ? (specialist as string) : undefined}
			/>

			<ContactPanel
				openPanel={contactOpen}
				onDismiss={() => {
					setContactOpen(false)
				}}
				contactId={contact ? (contact as string) : undefined}
			/>
		</>
	)
})
