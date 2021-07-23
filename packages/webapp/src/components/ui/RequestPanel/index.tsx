/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { Panel as FluentPanel, PanelType, Spinner } from '@fluentui/react'
import { memo, useState } from 'react'
import { useTranslation } from '~hooks/useTranslation'
import type ComponentProps from '~types/ComponentProps'
import RequestPanelBody from '~ui/RequestPanelBody'
import styles from './index.module.scss'

interface RequestPanelProps extends ComponentProps {
	openPanel?: boolean
	onDismiss?: () => void
	request?: { id: string; orgId: string }
}

const RequestPanel = memo(function RequestPanel({
	children,
	onDismiss,
	openPanel = false,
	request
}: RequestPanelProps): JSX.Element {
	const { c } = useTranslation()
	const [loaded, setIsLoaded] = useState<boolean>(false)

	const isLoaded = (loaded: boolean) => {
		setIsLoaded(loaded)
	}

	if (!request) return null

	return (
		<div>
			<FluentPanel
				isLightDismiss
				isOpen={openPanel}
				type={PanelType.medium}
				closeButtonAriaLabel={c('panelActions.close.ariaLabel')}
				onDismiss={onDismiss}
				styles={{
					main: {
						marginTop: 58
					},
					overlay: {
						marginTop: 58
					},
					contentInner: {
						marginTop: -44
					},
					content: {
						padding: 0
					},
					subComponentStyles: {
						closeButton: {
							root: {
								backgroundColor: 'white',
								borderRadius: '50%',
								marginRight: 20,
								width: 26,
								height: 26
							},
							icon: {
								color: '#2f9bed',
								fontWeight: 600
							}
						}
					}
				}}
			>
				<div>
					<div className={`${styles.loadingSpinner} ${loaded ? styles.loaded : null}`}>
						<Spinner label={c('panelActions.loading')} size={3} labelPosition='bottom' />
					</div>
					<RequestPanelBody request={request} onClose={onDismiss} isLoaded={isLoaded} />
				</div>
			</FluentPanel>
		</div>
	)
})
export default RequestPanel
