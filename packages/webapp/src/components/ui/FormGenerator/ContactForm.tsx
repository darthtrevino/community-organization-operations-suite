/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import cx from 'classnames'
import { Icon } from '@fluentui/react'
import type { FC } from 'react'
import { memo, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { ReactSelect } from '../ReactSelect'
import styles from './index.module.scss'
import type { FormFieldManager } from './FormFieldManager'
import { Namespace, useTranslation } from '~hooks/useTranslation'
import { empty } from '~utils/noop'
import type { Contact } from '@cbosuite/schema/dist/client-types'
import { ContactStatus } from '@cbosuite/schema/dist/client-types'
import type { OptionType } from '../FormikSelect'
import { useRecoilValue } from 'recoil'
import { organizationState } from '~store'

export const ContactForm: FC<{
	previewMode: boolean
	mgr: FormFieldManager
	onContactsChange: (contacts: Contact[]) => void
	onAddNewClient: () => void
	onChange: (submitEnabled: boolean) => void
}> = memo(function ContactForm({ previewMode, mgr, onAddNewClient, onChange, onContactsChange }) {
	const { t } = useTranslation(Namespace.Services)
	const org = useRecoilValue(organizationState)
	const options = org?.contacts
		? org.contacts.filter((c) => c.status !== ContactStatus.Archived).map(transformClient)
		: []
	const [contacts, setContacts] = useState<OptionType[]>(empty)

	return (
		<Row className='flex-column flex-md-row mb-4 align-items-end'>
			<Col className='mb-3 mb-md-0'>
				<div className={cx(styles.clientField)}>
					{t('formGenerator.addExistingClient')}
					<span className='text-danger'> *</span>
				</div>
				<ReactSelect
					isMulti
					placeholder={t('formGenerator.addClientPlaceholder')}
					options={options}
					defaultValue={contacts}
					onChange={(value) => {
						const newOptions = value as unknown as OptionType[]
						setContacts(newOptions)
						const filteredContacts = newOptions.map((c) =>
							org.contacts?.find((cc) => cc.id === c.value)
						)
						onContactsChange(filteredContacts)
						mgr.value.contacts = filteredContacts.map((c) => c.id)
						onChange(mgr.isSubmitEnabled())
					}}
				/>
			</Col>
			{!previewMode && (
				<Col md={3} className='mb-3 mb-md-0'>
					<button className={styles.newClientButton} onClick={onAddNewClient}>
						<span>{t('formGenerator.buttons.addNewClient')}</span>
						<Icon iconName='CircleAdditionSolid' className={cx(styles.buttonIcon)} />
					</button>
				</Col>
			)}
		</Row>
	)
})

function transformClient(client: Contact): OptionType {
	return {
		label: `${client.name.first} ${client.name.last}`,
		value: client.id.toString()
	}
}
