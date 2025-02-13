/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { Icon, Link } from '@fluentui/react'
import cx from 'classnames'
import { isValidElement, memo, useCallback } from 'react'
import { Button } from 'react-bootstrap'
import styles from './index.module.scss'
import { useWindowSize } from '~hooks/useWindowSize'
import type { StandardFC } from '~types/StandardFC'
import { ContainerRowColumn as CRC } from '~ui/CRC'
import { PersonalNav } from '~ui/PersonalNav'
import { TopNav } from '~ui/TopNav'
import { Notifications } from '~ui/Notifications'
import { LanguageDropdown } from '../LanguageDropdown'
import { useTranslation } from '~hooks/useTranslation'
import { useHistory } from 'react-router-dom'

export interface ActionBarProps {
	showNav?: boolean
	showBack?: boolean
	showTitle?: boolean
	showPersona?: boolean
	showNotifications?: boolean
	title?: string | JSX.Element
	size?: 'sm' | 'md' | 'lg'
	onBack?: () => void
}

/**
 * Top Level action bar
 */
export const ActionBar: StandardFC<ActionBarProps> = memo(function ActionBar({
	children,
	showNav = false,
	showBack = false,
	showTitle = false,
	showPersona = false,
	showNotifications = false,
	size,
	onBack,
	title
}) {
	const { isLG } = useWindowSize()
	const history = useHistory()
	const handleBackClick = useCallback(() => {
		if (onBack) {
			onBack()
		} else {
			history.goBack()
		}
	}, [history, onBack])
	const { c } = useTranslation()

	return (
		<div
			className={cx(
				'd-flex justify-content-between align-items-center py-3 bg-primary-dark text-light',
				styles.actionBar
			)}
		>
			<CRC size={size}>
				<div className='d-flex justify-content-between align-items-center'>
					<div className='d-flex align-items-center'>
						{showBack && (
							<Button
								className='btn-link text-light d-flex align-items-center text-decoration-none ps-0 pointer'
								onClick={handleBackClick}
							>
								<Icon className='me-2' iconName='ChevronLeft' /> Back
							</Button>
						)}

						{showTitle && title ? (
							isValidElement(title) && title
						) : (
							<strong className={cx('text-light', styles.actionBarTitle)}>{c('app.title')}</strong>
						)}

						{showTitle && typeof title === 'string' && (
							<Link href='/' className={cx('text-light', styles.actionBarTitle)}>
								<strong>{title}</strong>
							</Link>
						)}

						{isLG && showNav && <TopNav />}

						{children}
					</div>
					<div className='d-flex justify-content-between align-items-center'>
						<LanguageDropdown />
						{showNotifications && <Notifications />}
						{showPersona && <PersonalNav />}
					</div>
				</div>
			</CRC>
		</div>
	)
})
