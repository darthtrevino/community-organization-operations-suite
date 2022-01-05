/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { Contact } from '@cbosuite/schema/dist/client-types'
import { IDropdownOption } from '@fluentui/react'
import { useMemo } from 'react'
import { CustomDateRangeFilter } from '~components/ui/CustomDateRangeFilter'
import { CustomOptionsFilter } from '~components/ui/CustomOptionsFilter'
import { CustomTextFieldFilter } from '~components/ui/CustomTextFieldFilter'
import { IPaginatedTableColumn } from '~components/ui/PaginatedTable'
import { CLIENT_DEMOGRAPHICS } from '~constants'
import { useLocale } from '~hooks/useLocale'
import { Namespace, useTranslation } from '~hooks/useTranslation'
import styles from '../../index.module.scss'

export function useClientReportColumns(
	filterColumns: (columnId: string, option: IDropdownOption) => void,
	filterColumnTextValue: (key: string, value: string) => void,
	filterRangedValues: (key: string, value: string[]) => void,
	getDemographicValue: (demographicKey: string, contact: Contact) => string,
	hiddenFields: Record<string, boolean>
) {
	const { t } = useTranslation(Namespace.Reporting, Namespace.Clients)
	const [locale] = useLocale()

	return useMemo((): IPaginatedTableColumn[] => {
		const _pageColumns: IPaginatedTableColumn[] = [
			{
				key: 'name',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('clientList.columns.name'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomTextFieldFilter
							filterLabel={name}
							onFilterChanged={(value) => filterColumnTextValue(key, value)}
						/>
					)
				},
				onRenderColumnItem(item: Contact) {
					return `${item?.name?.first} ${item?.name?.last}`
				}
			},
			{
				key: 'gender',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('demographics.gender.label'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomOptionsFilter
							filterLabel={name}
							placeholder={name}
							options={CLIENT_DEMOGRAPHICS[key].options.map((o) => {
								return {
									key: o.key,
									text: t(`demographics.${key}.options.${o.key}`)
								}
							})}
							onFilterChanged={(option) => filterColumns(key, option)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return getDemographicValue('gender', item)
				}
			},
			{
				key: 'dateOfBirth',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('customFilters.birthdate'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomDateRangeFilter
							filterLabel={name}
							onFilterChanged={({ startDate, endDate }) => {
								const sDate = startDate ? startDate.toISOString() : ''
								const eDate = endDate ? endDate.toISOString() : ''
								filterRangedValues(key, [sDate, eDate])
							}}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString(locale) : ''
				}
			},
			{
				key: 'race',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('demographics.race.label'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomOptionsFilter
							filterLabel={name}
							placeholder={name}
							options={CLIENT_DEMOGRAPHICS[key].options.map((o) => ({
								key: o.key,
								text: t(`demographics.${key}.options.${o.key}`)
							}))}
							onFilterChanged={(option) => filterColumns(key, option)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return getDemographicValue('race', item)
				}
			},
			{
				key: 'ethnicity',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('demographics.ethnicity.label'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomOptionsFilter
							filterLabel={name}
							placeholder={name}
							options={CLIENT_DEMOGRAPHICS[key].options.map((o) => ({
								key: o.key,
								text: t(`demographics.${key}.options.${o.key}`)
							}))}
							onFilterChanged={(option) => filterColumns(key, option)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return getDemographicValue('ethnicity', item)
				}
			},
			{
				key: 'preferredLanguage',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('demographics.preferredLanguage.label'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomOptionsFilter
							filterLabel={name}
							placeholder={name}
							options={CLIENT_DEMOGRAPHICS[key].options.map((o) => ({
								key: o.key,
								text: t(`demographics.${key}.options.${o.key}`)
							}))}
							onFilterChanged={(option) => filterColumns(key, option)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return getDemographicValue('preferredLanguage', item)
				}
			},
			{
				key: 'preferredContactMethod',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('demographics.preferredContactMethod.label'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomOptionsFilter
							filterLabel={name}
							placeholder={name}
							options={CLIENT_DEMOGRAPHICS[key].options.map((o) => ({
								key: o.key,
								text: t(`demographics.${key}.options.${o.key}`)
							}))}
							onFilterChanged={(option) => filterColumns(key, option)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return getDemographicValue('preferredContactMethod', item)
				}
			},
			{
				key: 'preferredContactTime',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('demographics.preferredContactTime.label'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomOptionsFilter
							filterLabel={name}
							placeholder={name}
							options={CLIENT_DEMOGRAPHICS[key].options.map((o) => ({
								key: o.key,
								text: t(`demographics.${key}.options.${o.key}`)
							}))}
							onFilterChanged={(option) => filterColumns(key, option)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return getDemographicValue('preferredContactTime', item)
				}
			},
			{
				key: 'street',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('customFilters.street'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomTextFieldFilter
							filterLabel={name}
							onFilterChanged={(value) => filterColumnTextValue(key, value)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return item?.address?.street ?? ''
				}
			},
			{
				key: 'unit',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('customFilters.unit'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomTextFieldFilter
							filterLabel={name}
							onFilterChanged={(value) => filterColumnTextValue(key, value)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return item?.address?.unit ?? ''
				}
			},
			{
				key: 'city',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('customFilters.city'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomTextFieldFilter
							filterLabel={name}
							onFilterChanged={(value) => filterColumnTextValue(key, value)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return item?.address?.city ?? ''
				}
			},
			{
				key: 'county',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('customFilters.county'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomTextFieldFilter
							filterLabel={name}
							onFilterChanged={(value) => filterColumnTextValue(key, value)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return item?.address?.county ?? ''
				}
			},
			{
				key: 'state',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('customFilters.state'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomTextFieldFilter
							filterLabel={name}
							onFilterChanged={(value) => filterColumnTextValue(key, value)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return item?.address?.state ?? ''
				}
			},
			{
				key: 'zip',
				headerClassName: styles.headerItemCell,
				itemClassName: styles.itemCell,
				name: t('customFilters.zip'),
				onRenderColumnHeader(key, name, index) {
					return (
						<CustomTextFieldFilter
							filterLabel={name}
							onFilterChanged={(value) => filterColumnTextValue(key, value)}
						/>
					)
				},
				onRenderColumnItem(item: Contact, index: number) {
					return item?.address?.zip
				}
			}
		]

		const returnColumns = _pageColumns.filter((col) => !hiddenFields[col.key])
		return returnColumns
	}, [
		filterColumnTextValue,
		filterRangedValues,
		locale,
		t,
		getDemographicValue,
		filterColumns,
		hiddenFields
	])
}
