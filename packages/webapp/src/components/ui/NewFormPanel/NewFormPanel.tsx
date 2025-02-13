/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import type { FC } from 'react'
import { memo, useEffect, useState, useCallback } from 'react'
import { Namespace, useTranslation } from '~hooks/useTranslation'
import { AddClientForm } from '~components/forms/AddClientForm'
import { Panel } from '~components/ui/Panel'
import { useBoolean } from '@fluentui/react-hooks'
import { AddRequestForm } from '~forms/AddRequestForm'
import { QuickActionsPanelBody } from '~components/ui/QuickActionsPanelBody'
import { ServiceListPanelBody } from '~components/ui/ServiceListPanelBody'
import { noop } from '~utils/noop'

interface NewFormPanelProps {
	showNewFormPanel?: boolean
	newFormPanelName?: string
	onNewFormPanelSubmit?: (values: any, formName?: string) => void
	onNewFormPanelDismiss?: () => void
}

export const NewFormPanel: FC<NewFormPanelProps> = memo(function NewFormPanel({
	showNewFormPanel = false,
	newFormPanelName,
	onNewFormPanelSubmit = noop,
	onNewFormPanelDismiss = noop
}) {
	const [isNewFormPanelOpen, { setTrue: openNewFormPanel, setFalse: dismissNewFormPanel }] =
		useBoolean(false)

	const { t: clientT } = useTranslation(Namespace.Clients)
	const [newFormPanelNameState, setNewFormPanelName] = useState(newFormPanelName)

	const handleNewFormPanelDismiss = useCallback(() => {
		dismissNewFormPanel()
		onNewFormPanelDismiss()
	}, [dismissNewFormPanel, onNewFormPanelDismiss])

	const handleNewFormPanelSubmit = useCallback(
		(values: any) => {
			onNewFormPanelSubmit(values, newFormPanelNameState)
			handleNewFormPanelDismiss()
		},
		[onNewFormPanelSubmit, handleNewFormPanelDismiss, newFormPanelNameState]
	)

	const handleQuickActionsButton = useCallback(
		(buttonName: string) => {
			setNewFormPanelName(buttonName)
		},
		[setNewFormPanelName]
	)

	const renderNewFormPanel = useCallback(
		(formName: string): JSX.Element => {
			switch (formName) {
				case 'addClientForm':
					return (
						<AddClientForm
							title={clientT('clientAddButton')}
							closeForm={handleNewFormPanelDismiss}
						/>
					)
				case 'addRequestForm':
					return <AddRequestForm onSubmit={handleNewFormPanelSubmit} />
				case 'quickActionsPanel':
					return <QuickActionsPanelBody onButtonClick={handleQuickActionsButton} />
				case 'startServiceForm':
					return <ServiceListPanelBody />
				default:
					return null
			}
		},
		[clientT, handleNewFormPanelDismiss, handleNewFormPanelSubmit, handleQuickActionsButton]
	)

	useEffect(() => {
		setNewFormPanelName(newFormPanelName)
		if (showNewFormPanel) {
			openNewFormPanel()
		} else {
			dismissNewFormPanel()
		}
	}, [showNewFormPanel, newFormPanelName, openNewFormPanel, dismissNewFormPanel])
	return (
		<Panel openPanel={isNewFormPanelOpen} onDismiss={handleNewFormPanelDismiss}>
			{newFormPanelNameState && renderNewFormPanel(newFormPanelNameState)}
		</Panel>
	)
})
