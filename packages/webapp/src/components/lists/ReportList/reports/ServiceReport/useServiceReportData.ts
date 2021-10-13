/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */

import { Service } from '@cbosuite/schema/dist/client-types'
import { useEffect } from 'react'
import { empty } from '~utils/noop'

export function useServiceReportData(
	service: Service,
	setUnfilteredData: (data: unknown[]) => void,
	setFilteredData: (data: unknown[]) => void
) {
	useEffect(
		function initializeData() {
			const d = service.answers || empty
			setUnfilteredData(d)
			setFilteredData(d)
		},
		[service, setUnfilteredData, setFilteredData]
	)
}
