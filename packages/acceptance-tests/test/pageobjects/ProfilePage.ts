/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { Page } from './Page'

export class ProfilePage extends Page {
	private get profileForm() {
		return $(`[data-testid="profile-form"]`)
	}

	public async waitForLoad() {
		await this.profileForm.waitForExist()
		await super.waitForLoad()
	}

	public open() {
		return super.open('account')
	}
}
