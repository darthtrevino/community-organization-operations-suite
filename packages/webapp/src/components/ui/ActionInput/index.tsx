/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import cx from 'classnames'
import { Field } from 'formik'
import { useState, useCallback, memo } from 'react'
import styles from './index.module.scss'
import type { StandardFC } from '~types/StandardFC'
import { BoldLinkButton } from '~ui/BoldLinkButton'
import { IconButton } from '~ui/IconButton'
import { useTranslation } from '~hooks/useTranslation'

export interface ActionInputProps {
	onAddTag?: (tag: any) => void
	onAddSpecialist?: (specialist: any) => void
	actions?: { icon?: string; id: string; label: string; action: (value: any) => void }[]
	showSubmit?: boolean
	error?: string
	name: string
}

export const ActionInput: StandardFC<ActionInputProps> = memo(function ActionInput({
	className,
	onAddTag,
	onAddSpecialist,
	actions,
	showSubmit = false,
	error,
	name
}) {
	const { c } = useTranslation()
	const [focused, setFocus] = useState(false)
	const handleFocus = useCallback((val: boolean) => setFocus(val), [])

	return (
		<>
			<div
				className={cx(
					styles.requestActionForm,
					focused && styles.requestActionFormFocused,
					error && styles.requestActionFormDanger,
					className
				)}
			>
				<div className='p-2'>
					<Field
						onFocus={() => handleFocus(true)}
						onBlur={() => handleFocus(false)}
						className={cx(styles.requestActionFormInput)}
						name={name}
						placeholder={c('actionInput.textareaPlaceholder')}
						component='textarea'
						rows='3'
					/>
				</div>
				{actions?.length > 0 && (
					<div
						className={cx(
							styles.actionSection,
							'p-2 d-flex justify-content-between align-items-end align-items-lg-center w-100'
						)}
					>
						<div>
							{actions.map((action, i) => (
								<IconButton
									icon={action.icon || 'CircleAdditionSolid'}
									key={action.id}
									text={action.label}
									onClick={action.action}
								/>
							))}
						</div>

						{showSubmit && <BoldLinkButton type='submit' text={c('actionInput.submit')} />}
					</div>
				)}
			</div>

			{/* Handle errors */}
			{error ? <div className='p-2 px-3 text-danger'>{error}</div> : null}
		</>
	)
})
