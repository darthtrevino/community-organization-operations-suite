/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import styles from './index.module.scss'
import type ComponentProps from '~types/ComponentProps'
import { DatePicker, IDatePicker } from '@fluentui/react'
import { useField, useFormikContext } from 'formik'
import { memo, useRef } from 'react'
import cx from 'classnames'

interface FormikDatePickerProps extends ComponentProps {
	title?: string
	name: string
	placeholder?: string
	error?: string
	errorClassName?: string
	minDate?: Date
	maxDate?: Date
}

const FormikDatePicker = memo(function FormikDatePicker({
	className,
	error,
	errorClassName,
	placeholder,
	maxDate,
	minDate,
	...props
}: FormikDatePickerProps): JSX.Element {
	const datePickerRef = useRef<IDatePicker>(null)
	const { setFieldValue } = useFormikContext()
	const [field] = useField(props)

	return (
		<>
			<DatePicker
				{...field}
				{...props}
				componentRef={datePickerRef}
				placeholder={placeholder}
				allowTextInput={true}
				showMonthPickerAsOverlay={true}
				ariaLabel='Select a date'
				value={(field.value && new Date(field.value)) || null}
				onSelectDate={date => setFieldValue(field.name, date)}
				minDate={minDate}
				maxDate={maxDate}
				styles={{
					root: {
						border: 0
					},
					wrapper: {
						border: 0
					},
					textField: {
						border: '1px solid #979797',
						borderRadius: '3px',
						paddingTop: 4,
						selectors: {
							'.ms-TextField-fieldGroup': {
								border: 0,
								':after': {
									outline: 0,
									border: 0
								}
							}
						},
						':focus': {
							borderColor: '#0078d4'
						},
						':active': {
							borderColor: '#0078d4'
						},
						':hover': {
							borderColor: '#0078d4'
						}
					}
				}}
				className={cx(styles.formikField, className)}
			/>
			{error ? <div className={cx('pt-2 text-danger', errorClassName)}>{error}</div> : null}
		</>
	)
})
export default FormikDatePicker
