/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import type { Server } from 'http'
import type { GraphQLSchema } from 'graphql'
import { execute, subscribe } from 'graphql'
import type { ConnectionContext } from 'subscriptions-transport-ws'
import { SubscriptionServer } from 'subscriptions-transport-ws'
import type WebSocket from 'ws'
import { createLogger } from '~utils'
import type { RequestContextBuilder } from './RequestContextBuilder'
import { singleton } from 'tsyringe'

const wsLogger = createLogger('sockets')

@singleton()
export class SubscriptionServerBuilder {
	public constructor(private requestContextBuilder: RequestContextBuilder) {}

	public build(schema: GraphQLSchema, server: Server, path: string): SubscriptionServer {
		const result = SubscriptionServer.create(
			{
				schema,
				execute,
				subscribe,
				onConnect: async (
					params: {
						headers: {
							authorization: string
							accept_language: string
						}
					},
					_webSocket: WebSocket,
					_context: ConnectionContext
				) => {
					wsLogger(
						`client connected lang=${params.headers.accept_language}; authHeader.length=${
							params.headers.authorization?.length || 0
						};`
					)
					const requestCtx = await this.requestContextBuilder.build({
						locale: params.headers.accept_language,
						authHeader: params.headers.authorization
					})
					return { requestCtx }
				},
				onDisconnect: () => {
					wsLogger('client disconnected')
				}
			},
			{ server, path }
		)
		return result
	}
}
