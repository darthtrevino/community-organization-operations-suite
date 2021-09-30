/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { ApolloProvider } from '@apollo/client'
import { FC, memo } from 'react'
import { RecoilRoot } from 'recoil'
import { createApolloClient } from '~api'
import { NextRouter, useRouter } from 'next/router'

export const Stateful: FC = memo(function Stateful({ children }) {
	const router: NextRouter = useRouter()
	const apiClient = createApolloClient(router)
	return (
		<ApolloProvider client={apiClient}>
			<RecoilRoot>{children}</RecoilRoot>
		</ApolloProvider>
	)
})
