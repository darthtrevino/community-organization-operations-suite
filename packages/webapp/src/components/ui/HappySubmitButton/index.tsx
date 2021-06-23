/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { PrimaryButton } from '@fluentui/react'
import { memo, useCallback, useState } from 'react'
import Confetti from 'react-dom-confetti'
// import styles from './index.module.scss'
import type ComponentProps from '~types/ComponentProps'

const confettiConfig = {
	angle: 90,
	spread: 230,
	startVelocity: 40,
	elementCount: 60,
	dragFriction: 0.36,
	duration: 2000,
	stagger: 3,
	width: '6px',
	height: '6px',
	perspective: '500px',
	colors: ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a']
}

interface HappySubmitButtonProps extends ComponentProps {
	title?: string
	text?: string
	options?: Record<string, any>
	clickFunction?: () => void
}

const HappySubmitButton = memo(function HappySubmitButton({
	options,
	children,
	text,
	className,
	clickFunction
}: HappySubmitButtonProps): JSX.Element {
	const [active, setActive] = useState(false)
	const config = {
		...confettiConfig,
		...options
	}

	const handleClick = useCallback(() => {
		if (!active) {
			setActive(true)
			if (clickFunction) {
				clickFunction()
			}
			setTimeout(() => {
				setActive(false)
			}, 200)
		}
	}, [active, clickFunction])

	return (
		<PrimaryButton className={className} text={text} onClick={handleClick}>
			<Confetti active={active} config={config} />

			{children}
		</PrimaryButton>
	)
})
export default HappySubmitButton
