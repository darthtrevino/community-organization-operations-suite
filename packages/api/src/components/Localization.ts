/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { I18n } from 'i18n'
import { locales as staticCatalog } from '../locales'
import { createLogger } from '~utils'
import { singleton } from 'tsyringe'
const logger = createLogger('localization')

/**
 * Server Localization
 */
@singleton()
export class Localization {
	private i18nProvider: I18n

	/**
	 *
	 * @param i18nProvider The i18n provider
	 */
	public constructor() {
		this.i18nProvider = new I18n()

		this.i18nProvider.configure({
			defaultLocale: 'en-US',

			// will return translation from defaultLocale in case current locale doesn't provide it
			retryInDefaultLocale: true,

			// Sets a custom header name to read the language preference from - accept-language header by default
			header: 'accept_language',

			// Fallback names of standard diviations to available formats
			fallbacks: {
				en: 'en-US',
				'en-*': 'en-US',
				es: 'es-US',
				'es-*': 'es-US',
				uk: 'uk-UA',
				'uk-*': 'uk-UA'
			},

			// Enable object notation
			objectNotation: true,

			// set the language catalog statically
			// also overrides locales
			staticCatalog,

			// Use mustache with customTags (https://www.npmjs.com/package/mustache#custom-delimiters) or disable mustache entirely
			mustacheConfig: {
				tags: ['[[', ']]']
			}
		})
	}

	/**
	 *
	 * @returns string[] The list of available locale codes
	 */

	public getLocales(): Array<string> {
		return this.i18nProvider.getLocales()
	}

	/**
	 *
	 * @param string String to translate
	 * @param args Extra parameters
	 * @returns {string} Translated string
	 */

	public t(phrase: string, locale: string, args?: any): string {
		const result = this.i18nProvider.__({ phrase, locale }, args)
		if (!result) {
			logger(new Error('no localization found for phrase ' + phrase))
		}
		return result || ''
	}
}
