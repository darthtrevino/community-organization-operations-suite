/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import ContainerLayout from '~layouts/ContainerLayout'
import { memo, useState } from 'react'
import ClientOnly from '~ui/ClientOnly'
import { useServiceList } from '~hooks/api/useServiceList'
import { useCurrentUser } from '~hooks/api/useCurrentUser'
import { useRouter } from 'next/router'
import { useTranslation } from '~hooks/useTranslation'
import { wrap } from '~utils/appinsights'
import FormGenerator from '~components/ui/FormGenerator'
import { Title } from '~components/ui/Title'
import { NewFormPanel } from '~components/ui/NewFormPanel'

const EditService = memo(function EditService(): JSX.Element {
	const { orgId } = useCurrentUser()
	const { t } = useTranslation('services')
	const router = useRouter()
	const { serviceList, addServiceAnswer } = useServiceList(orgId)
	const [showForm, setShowForm] = useState(true)
	const [openNewFormPanel, setOpenNewFormPanel] = useState(false)
	const [newFormName, setNewFormName] = useState(null)

	const { sid } = router.query
	const selectedService =
		typeof sid === 'string' ? serviceList.find((s) => s.id === sid) : undefined

	const handleAddServiceAnswer = async (values) => {
		const res = await addServiceAnswer(values)
		if (res) {
			// Note: need a better way to do this
			setShowForm(false)
			setShowForm(true)
		}
	}
	const title = t('pageTitle')

	return (
		<ContainerLayout>
			<Title title={title} />
			<NewFormPanel
				showNewFormPanel={openNewFormPanel}
				newFormPanelName={newFormName}
				onNewFormPanelDismiss={() => setOpenNewFormPanel(false)}
			/>
			<ClientOnly>
				<div className='mt-5'>
					{showForm && (
						<FormGenerator
							service={selectedService}
							onSubmit={handleAddServiceAnswer}
							previewMode={false}
							onAddNewClient={() => {
								setOpenNewFormPanel(true)
								setNewFormName('addClientForm')
							}}
							onQuickActions={() => {
								setOpenNewFormPanel(true)
								setNewFormName('quickActionsPanel')
							}}
						/>
					)}
				</div>
			</ClientOnly>
		</ContainerLayout>
	)
})
export default wrap(EditService)
